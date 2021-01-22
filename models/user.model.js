const mongoose = require('mongoose');
const isEmail = require('validator/lib/isEmail');

const { PROVIDERS } = require('../config');

const USER_ROLES = ['user', 'admin', 'shop'];

const userSchema = new mongoose.Schema({
    userId: { type: String },
    displayName: { type: String, required: true },   
    provider: { type: String, enum: PROVIDERS, required: true },
    role: { type: String, enum: USER_ROLES },
    email: {
        type: String,
        validate: {
            validator: v => (!v || isEmail(v)),
            message: props => `${props.value} must be a valid email.`
        },
    }
}, { 
    toJSON: { virtuals: true },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

userSchema.statics.findOrCreate = function({ userId, provider = '', displayName, email } = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!PROVIDERS.includes(provider) || !userId) { 
                return reject(new Error('invalid'));
            }
            const userRecord = await this.findOne({ userId, provider, displayName });
            if (userRecord) { 
                return resolve({ user: userRecord, isNew: false });
            }
            const newUser = new this({ userId, provider, displayName, email });
            const newUserRecord = await newUser.save();
            resolve({ user: newUserRecord, isNew: true });
        } catch(err) {
            reject(err);
        }
    });
}

module.exports = mongoose.model('User', userSchema);