const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const gardenSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: 'User' },
    name: { type: String, required: true },   
}, { 
    toJSON: { virtuals: true },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Garden', gardenSchema);