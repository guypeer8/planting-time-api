const mongoose = require('mongoose');

const UserDiscriminator = require('./discriminators/user-discriminator');

const shopOwnerSchema = new mongoose.Schema({
    role: { type: String, enum: ['shop-owner'], default: 'shop-owner' },
});

module.exports = UserDiscriminator.discriminator('ShopOwner', shopOwnerSchema, { discriminatorKey: 'role' });