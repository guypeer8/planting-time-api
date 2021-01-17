const trim = require('lodash/trim');
const User = require('../../models/user.model');

const verifyEmail = async (userData, userEmail, { saveIfValid = false } = {}) => {
    const { _id, userId, provider, displayName } = userData;

    const email = trim(userEmail);
    if (!email) {
        return { valid: false, code: 'miss', error: 'Missing Email' };
    }

    try {
        const emailExists = await User.exists({ 
            email, 
            _id: { $ne: _id }, 
            userId: { $ne: userId },
        });
        if (emailExists) {
            return { valid: false, code: 'exists', error: 'The email provided already exists.' };
        }
        if (saveIfValid) {
            await User.updateOne(
                { _id, userId, provider, displayName },
                { $set: { email } }
            );
        }
        
        return { valid: true, code: 'success' };
    } catch(e) {
        return { valid: false, code: 'error', error: e.message };
    }
};

module.exports = {
    verifyEmail,
};

