require('dotenv').config();

const map = require('map-series');
const mongoose = require('mongoose');
const Youtube = require('youtube-api');
const kebabCase = require('lodash/kebabCase');
 
const { mongodbServer } = require('../../config');
const PlantModel = require('../../models/plant.model');

mongoose.connect(mongodbServer, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});
 
(async () => {
    try {
        const plants_count = await PlantModel.countDocuments();
        const plants = await PlantModel.getPlants({
            limit: plants_count,
            withCompanions: false,
            select_fields: ['metadata.common_name'],
        });

        const errors = [];
        map(plants, async (plant, cbk) => {
            const { _id, metadata } = plant;
            try {
                const slug = kebabCase(metadata.common_name || metadata.scientific_name);
                await PlantModel.updateOne({ _id }, { $set: { slug } });
            } catch(e) {
                errors.push({ _id, name: metadata.common_name, e });
            }
            cbk();
        }, () => {
            console.log(errors);
        });
    } catch(e) {
        console.warn(e);
    }
})();