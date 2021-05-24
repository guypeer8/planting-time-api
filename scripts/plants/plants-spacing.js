require('dotenv').config();

const keys = require('lodash/keys');
const mongoose = require('mongoose');
 
const { mongodbServer } = require('../../config');
const PlantModel = require('../../models/plant.model');

mongoose.connect(mongodbServer, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});
 
(async () => {
    try {
        const plant_spacing = require('./data/plants/plant-spacing.json');

        const errors = [];

        keys(plant_spacing).forEach(async (plant_name, i) => {
            setTimeout(async () => {
                const [plant] = await PlantModel.getPlants({
                    withCompanions: false,
                    search_keyword: plant_name,
                    select_fields: ['metadata.common_name', 'attributes', 'calendar'],
                });
                if (!plant) {
                    return errors.push({ name: plant_name });
                }
                const $set = {};
                const { _id } = plant;
                $set['spacing.row'] = plant_spacing[plant_name].row;
                $set['spacing.plant'] = plant_spacing[plant_name].plant;
                try {
                    await PlantModel.updateOne({ _id }, { $set });
                } catch(e) {
                    errors.push({ _id, name: plant_name, e });
                }
                console.warn('errors:', errors);
            }, i * 1200);
        });
    } catch(e) {
        console.warn(e);
    }
})();