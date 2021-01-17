const get = require('lodash/get');
const passport = require('passport');
const { Strategy: LinkedInStrategy } = require('passport-linkedin-oauth2');

const User = require('../../../models/user.model');
const { backendRoute } = require('../../../config');

passport.use(
    new LinkedInStrategy({
        clientID: process.env.LINKEDIN_KEY,
        clientSecret: process.env.LINKEDIN_SECRET,
        callbackURL: `${backendRoute}/api/auth/linkedin/callback`,
        scope: ['r_liteprofile', 'r_emailaddress'],
    }, 
    async (accessToken, refreshToken, profile, cb) => {
        try {
            const { user, isNew } = await User.findOrCreate({ 
                userId: profile.id, 
                provider: 'linkedin',
                displayName: profile.displayName,
                email: get(profile, 'emails[0].value', ''),
            });
            cb(null, { user, oneToken: accessToken || refreshToken, isNew });
        } catch(e) {
            cb(e, null);
        }
    })
);