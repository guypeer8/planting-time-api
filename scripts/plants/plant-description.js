require('dotenv').config();

const { join } = require('path');
const csv = require('csvtojson');
const omit = require('lodash/omit');
const last = require('lodash/last');
const mongoose = require('mongoose');
const initial = require('lodash/initial');
const lowerCase = require('lodash/lowerCase');
 
const { mongodbServer } = require('../../config');
const PlantModel = require('../../models/plant.model');

mongoose.connect(mongodbServer, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});
 
(async () => {
    try {
        const plants_data = await csv().fromFile(join('scripts', 'plants', 'data', 'plants', 'garden-vegetables.csv'));

        const errors = [];

        plants_data.forEach(async (plant_item, i) => {
            setTimeout(async () => {
                const [plant] = await PlantModel.getPlants({
                    withCompanions: false,
                    select_fields: ['metadata.common_name', 'attributes', 'calendar'],
                    search_keyword: lowerCase(last(plant_item.name) === 's' ? initial(plant_item.name).join('') : plant_item.name),
                });
                if (!plant) {
                    return errors.push({ name: plant_item.name });
                }
                const $set = {};
                const { _id, metadata } = plant;
                $set['metadata.description'] = plant_item.description;
                $set['growth.light.textual'] = plant_item.optimal_sun;
                $set['growth.soil.texture.textual'] = plant_item.optimal_soil;
                $set['growth.literal'] = omit(plant_item, ['id', 'name', 'description', 'optimal_sun', 'optimal_soil']);
                try {
                    await PlantModel.updateOne({ _id }, { $set });
                } catch(e) {
                    errors.push({ _id, name: metadata.common_name, e });
                }
                console.warn('errors:', errors);
            }, i * 1200);
        });
    } catch(e) {
        console.warn(e);
    }
})();