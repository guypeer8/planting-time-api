const get = require('lodash/get');
const set = require('lodash/set');
const mongoose = require('mongoose');
const isEmpty = require('lodash/isEmpty');
const isNumber = require('lodash/isNumber');
const isURL = require('validator/lib/isURL');
const isBoolean = require('lodash/isBoolean');
const { SEASONS } = require('@planting-time/constants/seasons');
const { getSeasonMonth } = require('@planting-time/constants/utils/season');
const { CLIMATE_ZONES } = require('@planting-time/constants/climate-zones');
const { HARDINESS_ZONES } = require('@planting-time/constants/hardiness-zones');

const ObjectId = mongoose.Schema.Types.ObjectId;

const PLANT_TYPES = ['fruit', 'vegetable', 'herb', 'flower', 'houseplant'];

const plantSchema = new mongoose.Schema({
    t_id: { type: String, unique: true }, // trefle id
    growth: {
        light: { 
            numeric: { type: Number, min: 0, max: 10 }, 
            textual: { type: String }, // describes detailed light conditions
        },
        temerature: { 
            min: { type: Number },
            max: { type: Number },
            optimal: { type: Number },
            // ideal in phases
        },   
        humidity: { type: Number }, 
        precipitation: { 
            min: { type: Number }, // mm/year
            max: { type: Number }, // mm/year
        }, 
        ph: { 
            min: { type: Number },
            max: { type: Number },
        }, 
        soil: {
            nutriments: {
                numeric: { type: Number, min: 0, max: 10 }, 
                textual: { type: String }, // describes detailed soil nutriments
            },
            salinity: {
                numeric: { type: Number, min: 0, max: 10 }, 
                textual: { type: String }, // describes detailed soil salinity
            },
            texture: {
                numeric: { type: Number, min: 0, max: 10 }, 
                textual: { type: String }, // describes detailed soil texture
            },
            humidity: {
                numeric: { type: Number, min: 0, max: 10 }, 
                textual: { type: String }, // describes detailed soil humidity
            },
        },
        days_to_maturity: { type: Number, min: 0 },
    },
    climate: {
        seasons: [{ type: String, enum: Object.values(SEASONS) }],
        hardiness_zones: [{ type: String, enum: Object.keys(HARDINESS_ZONES) }],
        climate_zones: [{ type: String, enum: CLIMATE_ZONES }],
        frost_sensitive: { type: Boolean, default: true },
    },
    calendar: {
        sow: [{ type: Number, min: 0, max: 11 }],
        seed: [{ type: Number, min: 0, max: 11 }],
        harvest: [{ type: Number, min: 0, max: 11 }],
        flowering: [{ type: Number, min: 0, max: 11 }],
    },
    taxonomy: {
        kingdom: { type: String },
        subkingdom: { type: String },
        division: { type: String },
        class: { type: String },
        order: { type: String },
        family: { type: String },
        genus: { type: String },
        species: { type: String },
    },
    metadata: {
        common_name: { type: String },
        scientific_name: { type: String },
        family_common_name: { type: String },
        images: [{ type: String }],
        description: { type: String },
        plant_part_images: mongoose.Schema.Types.Mixed,
    },
    attributes: {
        plant_type: { type: String, enum: PLANT_TYPES },
        is_edible: { type: Boolean, default: false },
        edible_part: { type: String },
        nutrients: {
            vitamins: [{ type: String }],
            minerals: [{ type: String }],
            health_benefits: [{ type: String }],
        },
    },
    distribution: {
        native: [{ type: String }],
        introduced: [{ type: String }],
    },
    dictionary: {
        common_names: mongoose.Schema.Types.Mixed, // { en: [Tomato, Garden tomato], ... }
        available_locales: [{ type: String }], // [en, fr, es, ...]
    }, 
    tags: [{ type: String }],
    tips: [{
        title: { type: String },
        description: { type: String },
        created_at: { type: Date },
    }],
    videos: [{
        title: { type: String },
        created_at: { type: Date },
        url: {
            type: String,
            validate: {
                validator: v => isURL(v),
                message: props => `${props.value} must be a valid url.`
            },
        },
    }], 
    pests: [{ type: ObjectId, ref: 'Pest' }],
    companions: [{ type: ObjectId, ref: 'Plant' }],
    non_companions: [{ type: ObjectId, ref: 'Plant' }],
    growth_methods: [{ type: String }], // hydrophonic, etc.
    search_keywords: [{ type: String }], // search keywords used to query the plant
    searchable: { type: Boolean, default: false }, // should the plant be queried 
}, { 
    toJSON: { virtuals: true },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const getCompanions = function(plant, { select_fields = null } = {}) {
    const query = { _id: { $nin: [plant._id] } };
    if (!isEmpty(plant.companions)) {
        set(query, '_id.$in', plant.companions);
    } else {
        const genus = get(plant, 'taxonomy.genus', null);
        if (!genus) return [];
        query['taxonomy.genus'] = genus;
        query._id.$nin.push(...plant.non_companions);
    }
    let queryBuilder = mongoose.model('Plant').find(query);
    if (select_fields) {
        queryBuilder = queryBuilder.select(select_fields.join(' '));
    }
    return queryBuilder.lean();
};

plantSchema.methods.getCompanions = function({ select_fields = null } = {}) {
    return getCompanions(this, { select_fields });
};

plantSchema.statics.getPlants = async function({ 
    id = null, 
    ids = null, 
    tmin = null, 
    tmax = null,
    pmin = null, 
    pmax = null,
    season = null,
    locale = 'en',
    searchable = true, 
    plant_type = null, 
    climate_zone = null,
    search_keyword = '',
    hardiness_zone = null,
    frost_sensitive = null, 
    native_distribution = null, 
    introduced_distribution = null, 
    withCompanions = true,
    select_fields = null,
    geo = { lat: null },
    page = 1,
    limit = 30,
    sort = 'metadata.common_name',
} = {}) {
    const query = { searchable };
    if (id) { 
        query._id = id;
    }
    if (ids) { 
        query._id = { $in: ids };
    }
    if (season) { 
        query.seasons = season;
    }
    if (isBoolean(frost_sensitive)) { 
        query['climate.frost_sensitive'] = frost_sensitive;
    }
    if (climate_zone) { 
        query['climate.climate_zones'] = { 
            $elemMatch: { 
                $regex: new RegExp(climate_zone),
                $options: 'i',
            },
        };
    }
    if (hardiness_zone) { 
        query['climate.hardiness_zones'] = { 
            $elemMatch: { 
                $regex: new RegExp(hardiness_zone),
                $options: 'i',
            },
        };
    }
    if (native_distribution) { 
        query['distribution.native'] = { 
            $elemMatch: { 
                $regex: new RegExp(native_distribution),
                $options: 'i',
            },
        };
    }
    if (introduced_distribution) { 
        query['distribution.introduced'] = { 
            $elemMatch: { 
                $regex: new RegExp(introduced_distribution),
                $options: 'i',
            },
        };
    }
    if (search_keyword) {
        const search_re = { $regex: new RegExp(search_keyword), $options: 'i' };
        query.$or = [
            { 'metadata.common_name': search_re },
            { 'metadata.scientific_name': search_re },
            { search_keywords: { $elemMatch: search_re } },
            ...['he', 'en'].map(loc => ({ 
                [`dictionary.common_names.${loc}`]: { $elemMatch: search_re },
            })),
        ];
        if (!['he', 'il', 'en'].includes(locale)) {
            query.$or.push({ 
                [`dictionary.common_names.${locale}`]: { $elemMatch: search_re },
            });
        }
    }
    if (tmin) {
        query['growth.temerature.min'] = { $lte: tmin };
    }
    if (tmax) {
        query['growth.temerature.max'] = { $gte: tmax };
    }
    if (pmin) {
        query['growth.precipitation.min'] = { $lte: pmin };
    }
    if (pmax) {
        query['growth.precipitation.max'] = { $gte: pmax };
    }
    if (plant_type) {
        query['attributes.plant_type'] = plant_type;
    }

    if (!isEmpty(geo) && isNumber(geo.lat)) {
        const { lat } = geo;
        const month = new Date().getMonth();
        const season_month = getSeasonMonth({ month, lat });
        query['calendar.sow'] = { $elemMatch: season_month };
    }

    let queryBuilder = this.find(query).limit(limit).skip((page-1) * limit).sort(sort);

    if (!withCompanions) {
        const select = [...(select_fields || []), '-companions', '-non_companions'].join(' ');
        return queryBuilder.select(select).lean();
    } 

    if (select_fields) {
        queryBuilder = queryBuilder.select(select_fields.join(' '));
    }

    const plants = await queryBuilder.lean();

    return Promise.all(plants.map(async plant => {
        plant.companions = await getCompanions(plant);
        delete plant.non_companions;
        return plant;
    }));
};

module.exports = mongoose.model('Plant', plantSchema);