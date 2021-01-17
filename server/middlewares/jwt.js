const get = require('lodash/get');
const has = require('lodash/has');
const lowerCase = require('lodash/lowerCase');

const jwt = require('../utils/jwt');

const { JWT_NAME } = process.env;

const jwtMiddleware = async (req, res, next) => {
  try {
    const authHeader = get(req.headers, 'authorization', null);

    if (authHeader) {
      const [authType, authToken] = authHeader.split(/\s+/);
      if (lowerCase(authType) === 'bearer') {
        req.user_auth = await jwt.verify(authToken);
      }
    } else if (has(req.cookies, JWT_NAME)) {
      const authToken = get(req.cookies, JWT_NAME, null);
      if (authToken) {
        req.user_auth = await jwt.verify(authToken);
      }
    }
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.redirect(`/login?returnTo=${req.originalUrl}`);
    }
  }
  
  next();
};

const ensureLoggedIn = (req, res, next) => {
    if (!req.user_auth) { 
      return res.status(401).send({ status: 'Not logged in.' });
    }
    
    const { _id, userId, provider, displayName } = req.user_auth;
    if (!(_id || userId || provider || displayName)) {
        return res.status(401).send({ status: 'Missing data' });
    }

    next();
};

const ensureLoggedOut = (req, res, next) => {
    if (!req.user_auth) { return next(); }
    res.status(401).send({ status: 'Already logged in.' });
};

module.exports = {
    jwtMiddleware,
    ensureLoggedIn,
    ensureLoggedOut,
};