const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const gardenSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: 'User' },
    name: { type: String, default: 'default' },   
}, { 
    toJSON: { virtuals: true },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});


gardenSchema.statics.getGardens = function({ user, limit = 10, sort = 'name' } = {}){
    return this.find({ user }).limit(limit).sort(sort).lean();
};

module.exports = mongoose.model('Garden', gardenSchema);