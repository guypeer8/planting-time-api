const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const shopProductSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: 'User' },
    shop: { type: ObjectId, ref: 'Shop' },
    name: { type: String, required: true },   
    description: { type: String, required: true }, 
    benefits: [{ type: String }],
    quantity: { type: Number, min: 0 },
    price: { type: Number, min: 0 },
    suitable_plants: [{ type: ObjectId, ref: 'Plant' }], // if empty, all plants suitable
    shipping: {
        has_shipping: { type: Boolean, default: false },
        cost: { type: Number, min: 0 },
    },
    discount: { type: Number, min: 0, max: 100 }, // percent
    comission: { type: Number, min: 0, max: 100 }, // percent
    rate: { type: Number, min: 0, max: 5 },
}, { 
    toJSON: { virtuals: true },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('ShopProduct', shopProductSchema);