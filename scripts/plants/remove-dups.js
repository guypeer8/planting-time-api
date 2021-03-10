require('dotenv').config();

const keys = require('lodash/keys');
const tail = require('lodash/tail');
const mongoose = require('mongoose');
const groupBy = require('lodash/groupBy');
 
const { mongodbServer } = require('../../config');
const PlantModel = require('../../models/plant.model');

mongoose.connect(mongodbServer, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});
 
(async key => {
    try {
        const plants_count = await PlantModel.countDocuments();
        const plants = await PlantModel.getPlants({
            limit: plants_count,
            withCompanions: false,
            select_fields: [key],
            extended_query: { 'metadata.common_name': { $ne: '', $exists: true } },
        });

        const dups = [];
        const grouped_plants = groupBy(plants, key);
        keys(grouped_plants).forEach(plant_key => {
            if (grouped_plants[plant_key].length > 1) {
                dups.push(...tail(grouped_plants[plant_key].map(x => x._id)));
            }
        });
        await PlantModel.deleteMany({ _id: { $in: dups } });
    } catch(e) {
        console.warn(e);
    }
})('t_id');