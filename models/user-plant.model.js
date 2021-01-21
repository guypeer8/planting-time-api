const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const userPlantSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: 'User', required: true },
    garden: { type: ObjectId, ref: 'Garden', required: true },
    plant: { type: ObjectId, ref: 'Plant', required: true },
    reminders_active: { type: Boolean, default: false },
    calendar: {
        sow_start: { type: Date },
        starter_start: { type: Date },
    },
});

module.exports = mongoose.model('UserPlant', userPlantSchema);