const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const companionSchema = new mongoose.Schema({
    plant_1: { type: ObjectId, ref: 'Plant' },
    plant_2: { type: ObjectId, ref: 'Plant' },
});

companionSchema.statics.getPlantCompanionsIds = async function(plant_id) {
    const companions_list = await this.find({ $or: [{ plant_1: plant_id }, { plant_2: plant_id }] }).lean();
    return companions_list.map(c => c.plant_1 === plant_id.toString() ? c.plant_2 : c.plant_1);
};

module.exports = mongoose.model('Companion', companionSchema);