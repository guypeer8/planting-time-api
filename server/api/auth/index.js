const get = require('lodash/get');
const uuidv4 = require('uuid/v4');
const passport = require('passport');
const { Base64 } = require('js-base64');
const router = require('express').Router();

const jwt = require('../../utils/jwt');
const User = require('../../../models/user.model');
const { ensureLoggedOut } = require('../../middlewares/jwt');
const { frontendRoute, PROVIDERS } = require('../../../config');

require('./google');
require('./facebook');

const authCallback = (req, res) => {
    const { state = '' } = req.query; 
    const { _id, userId, provider, ott, isNew } = req.user;
    const data = Base64.encode(JSON.stringify({ _id, userId, provider, ott, isNew }));
    const _pathname = state ? `/${state}` : req.path;
    res.redirect(`${frontendRoute}${_pathname}?data=${data}`);
};

/************
    GOOGLE
 ************/
router.get('/google', ensureLoggedOut, (req, res, next) => {
    const state = req.pathname;
    passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    authCallback
);

/**************
    FACEBOOK
 **************/
router.get('/facebook', ensureLoggedOut, (req, res, next) => {
    const state = req.pathname;
    passport.authenticate('facebook', { authType: 'rerequest', state })(req, res, next);
});
router.get(
    '/facebook/callback', 
    passport.authenticate('facebook', { session: false }),
    authCallback
);

/***********
    LOCAL
 ***********/
router.post('/local/login', ensureLoggedOut, async (req, res) => {
    const provider = 'local';
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email, provider });
  
      if (!user) {
        return res.json({ status: 'error', message: 'Email does not exist' });
      }
  
      const passwordsMatch = await user.checkPassword(password);
      if (!passwordsMatch) {
        return res.json({ status: 'error', message: 'Wrong password entered' });
      }
  
      const _user = { ...user._doc, ott: uuidv4() };
      const token = await jwt.sign(_user, user._doc);

      res.json({ status: 'success', payload: { token } });
    } catch(e) {
      res.json({ status: 'error', message: e.message || e.errmsg });
    }
});
  
router.post('/local/signup', ensureLoggedOut, async (req, res) => {
    const provider = 'local';
    try {
        const { name, email, password } = req.body;

        const userExists = await User.exists({ email, provider });
        if (userExists) {
            return res.json({ status: 'error', message: 'Email already exists' });
        }
        
        const user = new User({ name, email, password });
        const userSaved = await user.save();

        const _user = { ...userSaved._doc, ott: uuidv4() };
        const token = await jwt.sign(_user, userSaved._doc);

        res.json({ status: 'success', payload: { token } });
    } catch(e) {
        res.json({ status: 'error', message: e.message || e.errmsg });
    }
});

/**********
    JWT
 **********/
router.post('/sign-jwt', ensureLoggedOut, async (req, res) => {
    const { _id, userId, provider, ott } = req.body;

    if (_id && ott && PROVIDERS.includes(provider)) {
        try {
            const user = await User.findOne({ _id, userId, provider }).lean(); 
            if (user) { 
                const email = get(user, 'email', null);
                const token = await jwt.sign({ _id, userId, provider, ott }, user);
                return res.json({ status: 'success', payload: { token, email } });
            }
        } catch(e) {}
    }

    res.status(500).send('Maliciouse activity detected.');
});

module.exports = router;