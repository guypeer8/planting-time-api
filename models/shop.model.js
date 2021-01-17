const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const shopSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: 'User' },
    name: { type: String, required: true },   
    location: { type: String },
    currency: { type: String, enum: [] },
    inventory: [{ type: ObjectId, ref: 'ShopProduct' }],
    shipping: {
        has_shipping: { type: Boolean, default: false },
        cost: { type: Number, min: 0 },
        max_distance: { type: Number },
        min_order_price: { type: Number },
    },
    comission: { type: Number, min: 0, max: 100 }, // percent
}, { 
    toJSON: { virtuals: true },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Shop', shopSchema);