const jwt = require('jsonwebtoken');
const pick = require('lodash/pick');
const User = require('../../models/user.model');

const { JWT_SECRET, JWT_ALGORITHM } = process.env;

const USER_PICK = ['_id', 'userId', 'email', 'name', 'provider', 'role'];

const signJwt = (userData, userFromDB) => 
  new Promise(async (resolve, reject) => {
    const { _id, userId, provider, ott } = userData;
    const _user = userFromDB || await User.findOne({ _id, userId, provider }).lean();
    const expiresIn = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days in seconds
    const payload = { ott, exp: expiresIn, ...pick(_user, USER_PICK) };
    
    jwt.sign(
        payload, 
        Buffer.from(JWT_SECRET, 'base64'), 
        { issuer: _user.name, algorithm: JWT_ALGORITHM }, 
        (err, token) => { err ? reject(err) : resolve(token) }
    );
  });

const verifyJwt = token =>
  new Promise((resolve, reject) =>
    jwt.verify(
        token, 
        Buffer.from(JWT_SECRET, 'base64'), 
        { algorithms: [JWT_ALGORITHM] }, 
        (err, decoded) => {
            if (err) { return reject(err); }
            if (!decoded) { return reject(new Error('Decoded jwt is empty!')); }
            resolve(decoded);
        }
    )
  );

module.exports = {
  verify: verifyJwt,
  sign: signJwt,
};
