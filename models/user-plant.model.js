const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const userPlantSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: 'User' },
    garden: { type: ObjectId, ref: 'Garden' },
    plant: { type: ObjectId, ref: 'Plant' },
    reminders_active: { type: Boolean, default: false },
    calendar: {
        sow_start: { type: Date },
        starter_start: { type: Date },
    },
});

module.exports = mongoose.model('UserPlant', userPlantSchema);