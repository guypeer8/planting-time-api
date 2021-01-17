const set = require('lodash/set');
const mongoose = require('mongoose');
const isEmpty = require('lodash/isEmpty');
const isURL = require('validator/lib/isURL');
const isBoolean = require('lodash/isBoolean');

const { SEASONS } = require('../constants/seasons');
const { CLIMATE_ZONES } = require('../constants/climate-zones');
const { HARDINESS_ZONES } = require('../constants/hardiness-zones');

const ObjectId = mongoose.Schema.Types.ObjectId;

const PLANT_TYPES = ['fruit', 'vegetable', 'herb', 'flower', 'houseplant'];

const plantSchema = new mongoose.Schema({
    t_id: { type: String }, // trefle id
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
        percipitation: { 
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
    seasons: [{ type: String, enum: Object.values(SEASONS) }],
    hardiness_zones: [{ type: String, enum: Object.keys(HARDINESS_ZONES) }],
    climate_zones: [{ type: String, enum: CLIMATE_ZONES }],
    frost_sensitive: { type: Boolean, default: true },
    calendar: {
        sowing_months: {
            start: { type: Number, min: 0, max: 11 },
            end: { type: Number, min: 0, max: 11 },
        },
        seeding_months: {
            start: { type: Number, min: 0, max: 11 },
            end: { type: Number, min: 0, max: 11 },
        },
        harvest_months: {
            start: { type: Number, min: 0, max: 11 },
            end: { type: Number, min: 0, max: 11 },
        },
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

const getCompanions = function(plant) {
    const query = {};
    if (!isEmpty(plant.non_companions)) {
        set(query, '_id.$nin', plant.non_companions);
    }
    if (!isEmpty(plant.companions)) {
        set(query, '_id.$in', plant.companions);
    } else {
        set(query, 'taxonomy.genus', plant.taxonomy.genus);
    }
    return mongoose.model('Plant').find(query).lean();
};

plantSchema.methods.getCompanions = function() {
    return getCompanions(this);
};

plantSchema.statics.getPlants = async function({ 
    id = null, 
    ids = null, 
    searchable = true, 
    search_keyword = '',
    tmin = null, 
    tmax = null,
    pmin = null, 
    pmax = null,
    season = null,
    climate_zone = null,
    hardiness_zone = null,
    frost_sensitive = null, 
    plant_type = null, 
    withCompanions = true,
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
        query.frost_sensitive = frost_sensitive;
    }
    if (climate_zone) { 
        query.climate_zones = { 
            $elemMatch: { 
                $regex: new RegExp(climate_zone),
                $options: 'i',
            },
        };
    }
    if (hardiness_zone) { 
        query.hardiness_zones = { 
            $elemMatch: { 
                $regex: new RegExp(hardiness_zone),
                $options: 'i',
            },
        };
    }
    if (search_keyword) {
        const search_regex = new RegExp(search_keyword);
        query.$or = [
            { 
                'metadata.common_name': { 
                    $regex: search_regex, 
                    $options: 'i',
                },
            },
            { 
                'metadata.scientific_name': { 
                    $regex: search_regex, 
                    $options: 'i',
                },
            },
            { 
                search_keywords: { 
                    $elemMatch: {
                        $regex: search_regex, 
                        $options: 'i',
                    },
                },
            }
        ];
    }
    if (tmin) {
        set(query, 'growth.temerature.min', { $lte: tmin });
    }
    if (tmax) {
        set(query, 'growth.temerature.max', { $gte: tmax });
    }
    if (pmin) {
        set(query, 'growth.percipitation.min', { $lte: pmin });
    }
    if (pmax) {
        set(query, 'growth.percipitation.max', { $gte: pmax });
    }
    if (plant_type) {
        set(query, 'attributes.plant_type', plant_type);
    }

    if (!withCompanions) {
        return this.find(query).select('-companions -non_companions').lean();
    } 

    const plants = await this.find(query).lean();
    return Promise.all(plants.map(async plant => {
        plant.companions = await getCompanions(plant);
        delete plant.non_companions;
        return plant;
    }));
};

module.exports = mongoose.model('Plant', plantSchema);