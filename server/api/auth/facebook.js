const passport = require('passport');
const { Strategy: FacebookStrategy } = require('passport-facebook');

const User = require('../../../models/user.model');
const { backendRoute } = require('../../../config');

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${backendRoute}/api/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'email'],
    enableProof: true,
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
        const { user, isNew } = await User.findOrCreate({ 
          userId: profile.id, 
          name: profile.displayName || profile.username, 
          email: get(profile, '_json.email', ''),
          provider: 'facebook',
        });
        cb(null, { ...user, ott: accessToken || refreshToken, isNew });
    } catch(e) {
        cb(e, null);
    }
  }
));