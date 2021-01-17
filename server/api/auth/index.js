const get = require('lodash/get');
const passport = require('passport');
const { Base64 } = require('js-base64');
const router = require('express').Router();

const jwt = require('../../utils/jwt');

const User = require('../../../models/user.model');

const { ensureLoggedOut } = require('../../middlewares/jwt');
const { frontendRoute, PROVIDERS } = require('../../../config');

require('./github');
require('./google');
require('./facebook');
require('./linkedin');

const authCallback = (req, res) => {
    const { state = '' } = req.query; // templateType,templateName
    const { user, oneToken, isNew } = req.user;
    const { _id, userId, provider } = user;

    const data = Base64.encode(
        JSON.stringify({ _id, userId, provider, oneToken, isNew })
    );
    
    const pathname = state ? `/${state.replace(',', '/')}` : '';
    res.redirect(`${frontendRoute}/templates${pathname}?data=${data}`);
};

/************
    GITHUB
 ************/
router.get('/github', ensureLoggedOut, (req, res, next) => {
    const { state = '' } = req.query;
    passport.authenticate('github', { scope: ['user:email'], state })(req, res, next);
});
router.get(
    '/github/callback', 
    passport.authenticate('github', { session: false }),
    authCallback
);

/************
    GOOGLE
 ************/
router.get('/google', ensureLoggedOut, (req, res, next) => {
    const { state = '' } = req.query;
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
    const { state = '' } = req.query;
    passport.authenticate('facebook', { authType: 'rerequest', state })(req, res, next);
});
router.get(
    '/facebook/callback', 
    passport.authenticate('facebook', { session: false }),
    authCallback
);

/**************
    LINKEDIN
 **************/
router.get('/linkedin', ensureLoggedOut, (req, res,next) => {
    const { state = '' } = req.query;
    passport.authenticate('linkedin', (state ? { state } : {}))(req, res, next);
});
router.get(
    '/linkedin/callback', 
    passport.authenticate('linkedin', { session: false }),
    authCallback
);

router.post('/sign-jwt', ensureLoggedOut, async (req, res) => {
    const { _id, userId, provider, oneToken } = req.body;

    if (_id && userId && oneToken && PROVIDERS.includes(provider)) {
        try {
            const user = await User.findOne({ _id, userId, provider }).lean(); 
            if (user) { 
                const email = get(user, 'email', null);
                const jwtToken = await jwt.sign({ _id, userId, provider, oneToken }, user);
                return res.json({ jwtToken, email });
            }
        } catch(e) {}
    }

    res.status(500).send('Maliciouse activity detected.');
});

module.exports = router;