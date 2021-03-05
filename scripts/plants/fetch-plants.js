require('dotenv').config();

const fs = require('fs');
const axios = require('axios');
const map = require('map-series');
const set = require('lodash/set');
const keys = require('lodash/keys');
const last = require('lodash/last');
const mongoose = require('mongoose');
const first = require('lodash/first');
const isNil = require('lodash/isNil');
const sample = require('lodash/sample');
const isEmpty = require('lodash/isEmpty');
const isNumber = require('lodash/isNumber');
const kebabCase = require('lodash/kebabCase');
const startCase = require('lodash/startCase');

const { mongodbServer } = require('../../config');
const PlantModel = require('../../models/plant.model');

const api_tokens = Array.from({ length: 4 }).map((_, i) => process.env[`TREFLE_API_KEY_${i+1}`]);

const ENDPOINT = 'https://trefle.io';
// https://fdc.nal.usda.gov/portal-data/external/1103352

const cache = {
    plant_by_name: {},
    species_by_link: {},
    taxonomy_by_family: {},
};

const plants_by_type = {
    herb: require('./data/herbs'),
    flower: require('./data/flowers'),
    vegetable: require('./data/vegetables'),
};

const writeFile = (name, data, pretty = false) => {
    const args = pretty ? [null, 2] : [];
    fs.writeFileSync(`sample-data/${name}.json`, JSON.stringify(data, ...args));
};

const createEndpoint = (type, params = '') => {
    const token = sample(api_tokens);
    switch(type) {
        case 'plants':
            return `${ENDPOINT}/api/v1/plants?token=${token}${params}`;
        case 'search':
            return `${ENDPOINT}/api/v1/plants/search?token=${token}${params}`;
        case 'families':
            return `${ENDPOINT}/api/v1/families/${params}?token=${token}`;
        case 'species':
            return `${ENDPOINT}/api/v1/species?token=${token}${params}`;
        case 'genus':
            return `${ENDPOINT}/api/v1/genus?token=${token}${params}`;
        default:
            return ENDPOINT;
    }
};

const fetchPlantByName = async plant_name => {
    const plant_name_encoded = encodeURIComponent(plant_name);
    if (!cache.plant_by_name[plant_name_encoded]) {
        const search_endpoint = createEndpoint('search', `&q=${plant_name_encoded}`);
        const { data: { data: [plant] } } = await axios.get(search_endpoint);
        cache.plant_by_name[plant_name_encoded] = plant;
    }
    return cache.plant_by_name[plant_name_encoded];
};

const fetchPlantsByPage = async (page = 1) => {
    const plants_endpoint = createEndpoint('plants', `&page=${page}`);
    const { data: { data: plants, links } } = await axios.get(plants_endpoint);
    const next_page = links.next ? links.next.replace('/api/v1/plants?page=', '') : null;
    return { plants, next_page };
};

const fetchSpeciesByLink = async link => {
    if (!cache.species_by_link[link]) {
        const species_endpoint = `${createEndpoint()}${link}?token=${sample(api_tokens)}`;
        const { data: { data: species } } = await axios.get(species_endpoint)
        cache.species_by_link[link] = species;
    }
    return cache.species_by_link[link];
};

const createMetadata = async (result, plant) => {
    set(result, 'metadata', {
        common_name: plant.common_name,
        scientific_name: plant.scientific_name,
        family_common_name: plant.family_common_name,
        ...(plant.image_url ? { images: [plant.image_url] } : {})
    });
    result.slug = kebabCase(plant.common_name || plant.scientific_name);
};

const createCalendar = async (result, plant_name, plant_type) => {
    if (!plant_name || !plant_type) return;
    if (isEmpty(plants_by_type[plant_type][plant_name])) return;

    const { 
        wiki, hardiness_zone,
        sow_to_harvest_days, sow_to_germination_days,
        sow = [], seed = [], harvest = [], flowering = [], 
    } = plants_by_type[plant_type][plant_name];

    result.wiki = wiki;

    if (hardiness_zone) {
        if (isNumber(Number(hardiness_zone))) {
            set(result, 'climate.hardiness_zones', [`${hardiness_zone}a`, `${hardiness_zone}b`]);
            set(result, 'climate.frost_sensitive', Number(hardiness_zone) <= 9);
        } else {
            set(result, 'climate.hardiness_zones', [hardiness_zone]);
            set(result, 'climate.frost_sensitive', Number(hardiness_zone.slice(0, -1)) <= 9);
        }
    }
    set(result, 'calendar', { sow, seed, harvest, flowering });
    if (isNumber(sow_to_harvest_days)) {
        result.sow_to_harvest_days = sow_to_harvest_days;
    }
    if (isNumber(sow_to_germination_days)) {
        result.sow_to_germination_days = sow_to_germination_days;
    }
};

// const createClimateData = async (result, plant_name, plant_type) => {
//     if (hardiness_zone) {
//         if (isNumber(Number(hardiness_zone))) {
//             set(result, 'climate.hardiness_zones', [`${hardiness_zone}a`, `${hardiness_zone}b`]);
//             set(result, 'climate.frost_sensitive', Number(hardiness_zone) <= 9);
//         } else {
//             set(result, 'climate.hardiness_zones', [hardiness_zone]);
//             set(result, 'climate.frost_sensitive', Number(hardiness_zone.slice(0, -1)) <= 9);
//         }
//     }
//     if (climate_zones) {
//         set(result, 'climate.climate_zones', climate_zones);
//     }
//     // set(result, 'seasons', {});
// };

const createSpecies = async (result, plant, plant_type) => {
    const species = await fetchSpeciesByLink(plant.links.self);

    if (species.images) {
        set(result, 'metadata.plant_part_images', species.images);
    }
    
    set(result, 'attributes', {
        is_edible: species.edible,
        // edible_part: species.edible_part,
        duration: plant.duration || [], // [Annual, Biennial, Perennial]
    });

    if (plant_type || species.vegetable) {
        set(result, 'attributes.plant_type', plant_type || 'vegetable');
    }

    if (species.distribution) {
        set(result, 'distribution', species.distribution);
    }

    if (species.common_names) {
        set(result, 'dictionary.common_names', species.common_names);
        set(result, 'dictionary.available_locales', Object.keys(species.common_names));
    }

    if (species.growth.atmospheric_humidity) {
        set(result, 'growth.humidity', species.growth.atmospheric_humidity);
    }

    if (!isNaN(species.growth.ph_minimum) && !isNaN(species.growth.ph_maximum)) {
        set(result, 'growth.ph', {
            min: species.growth.ph_minimum,
            max: species.growth.ph_maximum,
        });
    }

    if (!isNaN(species.growth.light)) {
        set(result, 'growth.light.numeric', species.growth.light);
    }

    if (!isEmpty(species.growth.minimum_precipitation) && !isEmpty(species.growth.maximum_precipitation)) {
        const [min_measure, max_measure] = [
            first(keys(species.growth.minimum_precipitation)),
            first(keys(species.growth.maximum_precipitation)),
        ];
        if (!isNil(species.growth.minimum_precipitation[min_measure])) {
            const prcp = species.growth.minimum_precipitation[min_measure];
            set(result, 'growth.precipitation.min', min_measure === 'mm' ? prcp : prcp*10);
        }
        if (!isNil(species.growth.maximum_precipitation[max_measure])) {
            const prcp = species.growth.minimum_precipitation[max_measure];
            set(result, 'growth.precipitation.max', max_measure === 'mm' ? prcp : prcp*10);
        }
    }

    if (!isNaN(species.growth.minimum_temperature) && !isNaN(species.growth.maximum_temperature)) {
        const [min, max] = [
            species.growth.minimum_temperature.deg_c,
            species.growth.maximum_temperature.deg_c,
        ];
        set(result, 'growth.temperature', { min, max });
    }

    if (species.growth.soil_nutriments) {
        set(result, 'growth.soil.nutriments.numeric', species.growth.soil_nutriments);
    }
    if (species.growth.soil_salinity) {
        set(result, 'growth.soil.salinity.numeric', species.growth.soil_salinity);
    }
    if (species.growth.soil_texture) {
        set(result, 'growth.soil.texture.numeric', species.growth.soil_texture);
    }
    if (species.growth.soil_humidity) {
        set(result, 'growth.soil.humidity.numeric', species.growth.soil_humidity);
    }

    if (species.growth.days_to_harvest) {
        set(result, 'growth.days_to_maturity', species.growth.days_to_harvest);
    }
}

const createTaxonomy = async (result, plant) => {
    const taxonomy = await (async () => {
        if (!cache.taxonomy_by_family[plant.family]) {
            const families_endpoint = createEndpoint('families', plant.family);
            const { data: { data: plant_taxonomy } } = await axios.get(families_endpoint);
            cache.taxonomy_by_family[plant.family] = plant_taxonomy;
        }
        return cache.taxonomy_by_family[plant.family];
    })();

    set(result, 'taxonomy', { genus: plant.genus, family: plant.family });

    if (taxonomy.division_order) {
        result.taxonomy.order = taxonomy.division_order.name;
        if (taxonomy.division_order.division_class) {
            result.taxonomy.class = taxonomy.division_order.division_class.name;
            if (taxonomy.division_order.division_class.division) {
                result.taxonomy.division = taxonomy.division_order.division_class.division.name;
                if (taxonomy.division_order.division_class.division.subkingdom) {
                    result.taxonomy.subkingdom = taxonomy.division_order.division_class.division.subkingdom.name;
                    if (taxonomy.division_order.division_class.division.subkingdom) {
                        result.taxonomy.kingdom = taxonomy.division_order.division_class.division.subkingdom.kingdom.name;
                    }
                }
            }
        }
    }
};

const buildPlantsByNames = ({ 
    plant_names = [], 
    plant_type = null,
    onFinish = () => {},
} = {}) => {
    const plants = (() => {
        if (!plant_type) return plant_names;
        return [...plant_names, ...keys(plants_by_type[plant_type])];
    })();

    map(plants, async (plant_name, cbk) => {
        const fetch_name = (() => {
            if (!plant_type) return plant_name;
            if (isEmpty(plants_by_type[plant_type][plant_name])) return plant_name;
            const scientific_name = plants_by_type[plant_type][plant_name].scientific_name;
            if (scientific_name) return scientific_name;
            const wiki = plants_by_type[plant_type][plant_name].wiki;
            if (wiki) {
                return startCase(last(wiki.split('/'))
                .replace('_(plant)', '')
                .replace('_(genus)',''));
            }
            return plant_name;
        })();

        try {
            const result = {};
            const plant = await fetchPlantByName(fetch_name);
            result.t_id = plant.id;

            await createMetadata(result, plant);
            await createSpecies(result, plant, plant_type);
            await createTaxonomy(result, plant);
            await createCalendar(result, plant_name, plant_type);

            cbk(null, { result });
        } catch(e) {
            cbk(null, { error: e.message, plant_name });
        }
    }, (_, plants_data) => {
        const results = plants_data.filter(p => p.result && !p.error).map(r => r.result);
        const failed = plants_data.filter(p => !p.result && p.error);
        onFinish({ results, failed });
    });
};

const buildPlantsByPage = async ({ 
    page = 1, 
    until_page = null,
    loop = true,
    onPageFinished = () => {},
    onLastPage = () => {},
} = {}) => {
    const { plants, next_page } = await fetchPlantsByPage(page);

    map(plants, async (plant, cbk) => {
        try {
            const result = {};
            result.t_id = plant.id;

            await createMetadata(result, plant);
            await createSpecies(result, plant);
            await createTaxonomy(result, plant);

            cbk(null, { result });
        } catch(e) {
            cbk(null, { error: e, plant_name: plant.common_name });
        }
    }, async (_, plants_data) => {
        const results = plants_data.filter(p => p.result && !p.error).map(r => r.result);
        const failed = plants_data.filter(p => !p.result && p.error);

        await onPageFinished({ results, failed, page, next_page });

        if (until_page && Number(page) === until_page) {
            return onLastPage();
        }

        if (loop) {
            if (next_page) {
                await buildPlantsByPage({ 
                    page: next_page, 
                    until_page,
                    loop, 
                    onPageFinished, 
                    onLastPage,
                });
            } else {
                onLastPage();
            }
        }
    });
};

function runDatabaseBuildByPlantName(plant_names = [], { 
    plant_type = null, 
    save_to_db = false, 
    write_files = true,
    searchable = true,
} = {}) {
    buildPlantsByNames({
        plant_names,
        plant_type,
        async onFinish({ results, failed }) {
            const _results = searchable ? results.map(r => ({ ...r, searchable: true })) : results;

            if (write_files && !isEmpty(failed)) {
                writeFile('failed_plants_by_names', failed, true);
            }

            write_files && writeFile('plants_by_names', _results, true);
            
            if (save_to_db) {
                mongoose.connect(mongodbServer, { useNewUrlParser: true, useUnifiedTopology: true });
                try {
                    _results.forEach(async plant => {
                        try {
                            const plantRecord = new PlantModel(plant);
                            await plantRecord.save();
                        } catch(e) {
                            console.error(e);
                        }
                    });
                } catch(e) {
                    console.log(e);
                    // failed_insertsion_by_page[page] = e;
                }
            }
        }
    });
}

// function runPageByPageDatabaseBuild({ save_to_db = false, write_files = true } = {}) {
//     const failed_by_page = {};
//     const failed_insertion_by_page = {};

//     if (save_to_db) {
//         mongoose.connect(mongodbServer, { useNewUrlParser: true, useUnifiedTopology: true });
//     }

//     buildPlantsByPage({ 
//         until_page: 2,
//         async onPageFinished({ results, failed, page }) {
//             if (write_files && !isEmpty(failed)) {
//                 failed_by_page[page] = failed;
//             }
//             write_files && writeFile(`page_${page}`, results, true);
//             if (save_to_db) {
//                 try {
//                     await PlantModel.insertMany(results);
//                 } catch(e) {
//                     write_files && (failed_insertion_by_page[page] = e);
//                 }
//             }
//         },
//         onLastPage() {
//             write_files && writeFile('failed_plants', failed_by_page);
//             save_to_db && writeFile('failed_insersion_plants', failed_insertsion_by_page);
//             console.info('Finished last page!');
//         },
//     });
// }

// runDatabaseBuildByPlantName(
//     [
//         'tomato',
//         'potato',
//         'cucumber', 
//         'onion', 
//         'garlic', 
//         'broccoli', 
//         'basil', 
//         'sweet corn', 
//         'cauliflower', 
//         'celery',
//         'Beans',
//         'Broccoli',
//         'Cabbage',
//         'Kale',
//         'Lettuce',
//         'mango',
//     ], 
//     { 
//         save_to_db: true,
//     }
// );

// runPageByPageDatabaseBuild();

function buildHerbsDatabase() {
    runDatabaseBuildByPlantName([], { plant_type: 'herb', save_to_db: true });
}

function buildFlowersDatabase() {
    runDatabaseBuildByPlantName([], { plant_type: 'flower', save_to_db: true });
}

function buildVegetablesDatabase() {
    runDatabaseBuildByPlantName([], { plant_type: 'vegetable', save_to_db: true });
}

function buildDatabase() {
    // buildHerbsDatabase();
    // buildFlowersDatabase();
    buildVegetablesDatabase();
}

buildDatabase();