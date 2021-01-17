
const get = require('lodash/get');
const passport = require('passport');
const { Strategy: GitHubStrategy } = require('passport-github2');

const User = require('../../../models/user.model');
const { backendRoute } = require('../../../config');

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${backendRoute}/api/auth/github/callback`,
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
        const { user, isNew } = await User.findOrCreate({ 
          userId: profile.id, 
          displayName: profile.displayName || profile.username, 
          email: get(profile, '_json.email', ''),
          provider: 'github',
        });
        cb(null, { user, oneToken: accessToken || refreshToken, isNew });
    } catch(e) {
        cb(e, null);
    }
  }
));