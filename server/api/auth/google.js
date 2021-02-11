
const get = require('lodash/get');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

const User = require('../../../models/user.model');
const { backendRoute } = require('../../../config');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${backendRoute}/api/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      const { user, isNew } = await User.findOrCreate({ 
        userId: profile.id, 
        provider: 'google',
        name: profile.displayName,
        email: get(profile, 'emails[0].value', ''),
      });
      cb(null, { ...user, ott: accessToken || refreshToken, isNew });
    } catch(e) {
      cb(e, null);
    }
  }
));