const get = require('lodash/get');
const set = require('lodash/set');
const mongoose = require('mongoose');
const isEmpty = require('lodash/isEmpty');
const isNumber = require('lodash/isNumber');
const isURL = require('validator/lib/isURL');
const isBoolean = require('lodash/isBoolean');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const { SEASONS } = require('@planting-time/constants/seasons');
const { getSeasonMonth } = require('@planting-time/constants/utils/season');
const { CLIMATE_ZONES } = require('@planting-time/constants/climate-zones');
const { HARDINESS_ZONES } = require('@planting-time/constants/hardiness-zones');

const ObjectId = mongoose.Schema.Types.ObjectId;

const PLANT_TYPES = ['fruit', 'vegetable', 'herb', 'flower', 'houseplant'];

const plantSchema = new mongoose.Schema({
    t_id: { type: String, unique: true }, // trefle id
    slug: { type: String, unique: true }, 
    wiki: {
        type: String,
        validate: {
            validator: v => !v || isURL(v),
            message: props => `${props.value} must be a valid url.`
        },
    },
    growth: {
        light: { 
            numeric: { type: Number, min: 0, max: 10 }, 
            textual: { type: String }, // describes detailed light conditions
        },
        temperature: { 
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
        days_to_maturity: { type: Number, min: -1 },
    },
    climate: {
        hardiness_zones: [{ type: String, enum: Object.keys(HARDINESS_ZONES) }],
        climate_zones: [{ type: String, enum: CLIMATE_ZONES }],
        frost_sensitive: { type: Boolean, default: true },
    },
    calendar: {
        sow: [{ type: Number, min: 0, max: 11 }],
        seed: [{ type: Number, min: 0, max: 11 }],
        harvest: [{ type: Number, min: 0, max: 11 }],
        flowering: [{ type: Number, min: 0, max: 11 }],
        sow_to_harvest_days: { type: Number, default: -1 },
        sow_to_germination_days: { type: Number, default: -1 },
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
        description: { type: String },
        created_at: { type: Date },
        thumbnails: { type: mongoose.Schema.Types.Mixed },
        url: {
            type: String,
            validate: {
                validator: v => isURL(v),
                message: props => `${props.value} must be a valid url.`
            },
        },
    }], 
    // pests: [{ type: ObjectId, ref: 'Pest' }],
    companions: [{ type: ObjectId, ref: 'Plant' }],
    non_companions: [{ type: ObjectId, ref: 'Plant' }],
    growth_methods: [{ type: String }], // hydrophonic, etc.
    search_keywords: [{ type: String }], // search keywords used to query the plant
    searchable: { type: Boolean, default: false }, // should the plant be queried 
}, { 
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const getCompanions = function(plant, { select_fields = null } = {}) {
    const query = { _id: { $nin: [plant._id] } };
    if (!isEmpty(plant.companions)) {
        set(query, '_id.$in', plant.companions);
    } else {
        const family = get(
            plant, 
            'taxonomy.family', 
            get(plant, 'metadata.family_common_name', null)
        );
        if (!family) {
            return [];
        }
        query.$or = [
            { 'metadata.family_common_name': family }, 
            { 'taxonomy.family': family },
        ];
        query._id.$nin.push(...plant.non_companions);
    }
    let queryBuilder = mongoose.model('Plant').find(query);
    if (select_fields) {
        queryBuilder = queryBuilder.select(select_fields.join(' '));
    }
    return queryBuilder.lean({ virtuals: true });
};

plantSchema.methods.getCompanions = function({ select_fields = null } = {}) {
    return getCompanions(this, { select_fields });
};

plantSchema.statics.getPlants = async function({ 
    id = null, 
    ids = null, 
    slug = null, 
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
    limit = 50,
    sort = 'metadata.common_name',
    lean = true,
    extended_query = {},
} = {}) {
    const query = { searchable, ...extended_query };
    if (id) { 
        query._id = id;
    }
    if (ids) { 
        query._id = { $in: ids };
    }
    if (slug) { 
        query.slug = slug;
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
        if (!query.$and) { query.$and = []; }
        const search_re = { $regex: new RegExp(search_keyword), $options: 'i' };
        const $or = [
            { search_keywords: { $elemMatch: search_re } },
            ...['common_name', 'scientific_name'].map(name => ({ [`metadata.${name}`]: search_re })),
            ...['he', 'en'].map(loc => ({ 
                [`dictionary.common_names.${loc}`]: { $elemMatch: search_re },
            })),
        ];
        if (!['he', 'il', 'en'].includes(locale)) {
            $or[`dictionary.common_names.${locale}`] = { $elemMatch: search_re };
        }
        query.$and.push({ $or });
    }
    if (isNumber(tmax)) {
        if (!query.$and) { query.$and = []; }
        query.$and.push({ 
            $or: [ 
                { 'growth.temperature.max': { $gte: tmax } }, 
                { 'growth.temperature.max': { $exists: false } }, 
            ],
        });
    }
    if (isNumber(tmin)) {
        if (!query.$and) { query.$and = []; }
        query.$and.push({ 
            $or: [ 
                { 'growth.temperature.min': { $lte: tmin } }, 
                { 'growth.temperature.min': { $exists: false } }, 
            ],
        });
    }
    if (isNumber(pmax)) {
        if (!query.$and) { query.$and = []; }
        query.$and.push({ 
            $or: [ 
                { 'growth.precipitation.min': { $gte: pmax } }, 
                { 'growth.precipitation.min': { $exists: false } }, 
            ],
        });
    }
    if (isNumber(pmin)) {
        if (!query.$and) { query.$and = []; }
        query.$and.push({ 
            $or: [ 
                { 'growth.precipitation.max': { $lte: pmin } }, 
                { 'growth.precipitation.max': { $exists: false } }, 
            ],
        });
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
        // const select = (select_fields || []).join(' ').trim();
        queryBuilder = queryBuilder.select('-companions -non_companions');
        return lean ? queryBuilder.lean({ virtuals: true }) : queryBuilder;
    } 

    if (select_fields) {
        queryBuilder = queryBuilder.select(select_fields.join(' '));
    }

    const plants = await (lean ? queryBuilder.lean({ virtuals: true }) : queryBuilder);

    return Promise.all(plants.map(async plant => {
        plant.companions = await getCompanions(plant);
        delete plant.non_companions;
        return plant;
    }));
};

plantSchema.plugin(mongooseLeanVirtuals);

plantSchema.virtual('id').get(function() {
    return this._id.toString();
});

module.exports = mongoose.model('Plant', plantSchema);