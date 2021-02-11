const mongoose = require('mongoose');

const UserDiscriminator = require('./discriminators/user-discriminator');

const adminSchema = new mongoose.Schema({
    role: { type: String, enum: ['admin'], default: 'admin' },
});

module.exports = UserDiscriminator.discriminator('Admin', adminSchema, { discriminatorKey: 'role' });