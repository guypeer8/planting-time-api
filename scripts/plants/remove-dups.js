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
 
(async () => {
    try {
        const plants_count = await PlantModel.countDocuments();
        const plants = await PlantModel.getPlants({
            limit: plants_count,
            withCompanions: false,
            select_fields: ['metadata.common_name'],
            extended_query: { 'metadata.common_name': { $ne: '', $exists: true } },
        });

        const dups = [];
        const grouped_plants = groupBy(plants, 'metadata.common_name');
        keys(grouped_plants).forEach(plant_name => {
            if (grouped_plants[plant_name].length > 1) {
                dups.push(...tail(grouped_plants[plant_name].map(x => x._id)));
            }
        });
        await PlantModel.deleteMany({ _id: { $in: dups } });
        cbk();
    } catch(e) {
        console.warn(e);
    }
})();