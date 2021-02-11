const mongoose = require('mongoose');

const UserDiscriminator = require('./discriminators/user-discriminator');

const userSchema = new mongoose.Schema({
    role: { type: String, enum: ['user'], default: 'user' },
});

module.exports = UserDiscriminator.discriminator('Base', userSchema, { discriminatorKey: 'role' });