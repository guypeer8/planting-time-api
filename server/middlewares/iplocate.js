const rp = require('request-promise');
const iplocate = require('node-iplocate');
const isPlainObject = require('lodash/isPlainObject');
const { IPAPI_API, IPSTACK_API, IPGEOLOCATION_API } = require('../../config');

module.exports = async (req, _, next) => {
  let { user_geo } = req.query;

  if (user_geo || !req.ip) {
    req.user_geo = user_geo;
    return next();
  }

  let ipConfig = null;
  try {
    ipConfig = await rp.get(IPGEOLOCATION_API.replace('{{IP}}', req.ip));
    if (ipConfig && ipConfig.alpha2) {
      ipConfig.country_code = ipConfig.alpha2;
    }
  } catch (e) {
    try {
      ipConfig = await iplocate(req.ip);
    } catch (e) {
      try {
        ipConfig = await rp.get(IPSTACK_API.replace('{{IP}}', req.ip));
      } catch (e) {
        try {
          ipConfig = await rp.get(IPAPI_API.replace('{{IP}}', req.ip));
          if (ipConfig && ipConfig.country) {
            ipConfig.country_code = ipConfig.country;
          }
        } catch (e) {
        }
      }
    }
  }

  if (ipConfig && isPlainObject(ipConfig)) {
    req.user_geo = ipConfig;
  }

  next();
};
