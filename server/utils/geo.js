require('dotenv').config();

const axios = require('axios');
const geoTz = require('geo-tz');
const get = require('lodash/get');
const has = require('lodash/has');
const maxmind = require('maxmind');
const omit = require('lodash/omit');
const merge = require('lodash/merge');
const rp = require('request-promise');
const every = require('lodash/every');
const sample = require('lodash/sample');
const iplocate = require('node-iplocate');
const isNumber = require('lodash/isNumber');
const ccLookup = require('country-code-lookup');
const isPlainObject = require('lodash/isPlainObject');
const { getSeason } = require('@planting-time/constants/utils/season');
const { getAverageSunHours } = require('@planting-time/constants/utils/sunlight');
const { getHardinessZone } = require('@planting-time/constants/utils/hardiness-zone');

const { fetchClimateZone } = require('./zone');
const { getClimateNormals } = require('./weather');
const { FREE_GEOIP, IPSTACK_API, IPGEOLOCATION_API, MAPQUEST_REVERSE_GEO_API } = require('../../config');

const continent_by_code = {
  AF: 'Africa',
  AN: 'Antarctica',
  AS: 'Asia',
  EU: 'Europe',
  NA: 'North America',
  OC: 'Oceania',
  SA: 'South America',
};

const mapquest_api_keys = Array.from({ length: 4 }).map((_, i) => process.env[`MAPQUEST_KEY_${i+1}`]);

const fetchGeoByCoords = async (lat, lon) => {
  try {
    const  geo_config = { geo: { latitude: lat, longitude: lon } };
    const { data } = await axios.get(`${MAPQUEST_REVERSE_GEO_API}?key=${sample(mapquest_api_keys)}&location=${lat},${lon}`);
    if (data && has(data, 'results[0].locations[0]')) {
      const code = get(data, 'results[0].locations[0].adminArea1', null);
      const cc_lookup = ccLookup.byIso(code);
      const timezone = get(geoTz(lat, lon), '[0]', null);
      if (code && cc_lookup) {
        merge(geo_config, {
          geo: { timezone },
          location: {
            code: get(data, 'results[0].locations[0].adminArea1'),
            country: cc_lookup.country,
            continent: cc_lookup.continent,
            city: get(data, 'results[0].locations[0].adminArea5'),
          },
        });
      }
    }
    return geo_config;
  } catch(e) {
    return null;
  }
};

const fetchGeoByIp = async ip => {
  if (!ip) {
    return null;
  }

  let geo_config = null;
  try {
    const lookup = await maxmind.open('maxmind/GeoLite2-City.mmdb');
    const result = lookup.get(ip);  

    if (result && has(result, 'location.latitude') && has(result, 'country.names') && has(result, 'city.names') && has(result, 'continent.names')) {
      const { latitude, longitude, time_zone: timezone } = result.location;
      const { iso_code: code } = result.country;
      const continent = result.continent.names.en || continent_by_code[result.continent.code];
      geo_config = {
        geo: { latitude, longitude, timezone },
        location: { code, continent, country: result.country.names.en, city: result.city.names.en },
      };
    } else {
      throw new Error();
    }
  } catch (e) {
    try {
      const result = JSON.parse(await rp.get(IPSTACK_API.replace('{{IP}}', ip)));

      if (result.location) {
        const { latitude, longitude, city, country_code: code, country_name: country } = result;
        const continent = result.continent_name || continent_by_code[result.continent_code];
        const timezone = result.timezone || get(geoTz(latitude, longitude), '[0]', null);
        geo_config = {
          geo: { latitude, longitude, timezone },
          location: { code, country, continent, city },
        };
      } else {
        throw new Error();
      }
    } catch (e) {
      try {
        const result = await iplocate(ip);
        if (result && result.country && result.latitude) {
          const { latitude, longitude, time_zone: timezone, country_code: code, country, continent, city } = result;
          geo_config = {
            geo: { latitude, longitude, timezone, },
            location: { code, country, continent, city },
          };
        } else {
          throw new Error();
        }
      } catch (e) {
        try {
          const [result, free_geoip] = await Promise.all([
            rp.get(IPGEOLOCATION_API.replace('{{IP}}', ip)),
            rp.get(FREE_GEOIP.replace('{{IP}}', ip)),
          ]).map(JSON.parse);
          if (result && result.alpha2 && result.geo) {
            const code = result.alpha2;
            const { latitude, longitude } = result.geo;
            const { continent, name: country } = result;
            const { time_zone: timezone, city } = free_geoip;
            geo_config = {
              geo: { latitude, longitude, timezone },
              location: { code, country, continent, city },
            };
          } else {
            throw new Error();
          }
        } catch (e) {
          try {
            const result = JSON.parse(await rp.get(FREE_GEOIP.replace('{{IP}}', ip)));
            if (result && result.country_code && result.latitude) {
              const { latitude, longitude, city, time_zone: timezone, country_code: code, country_name: country } = result;
              const continent = get(ccLookup.byIso(code), 'continent');
              geo_config = {
                geo: { latitude, longitude, timezone },
                location: { code, country, continent, city },
              };
            } else {
              throw new Error();
            }
          } catch(e) {
            try {
              const result = await rp.get(`http://ip-api.com/json/${ip}`);
              if (result && result.status === 'success' && result.countryCode && result.lat) {
                const { lat: latitude, lon: longitude, timezone, countryCode: code, country, city } = result;
                const continent = get(ccLookup.byIso(code), 'continent');
                geo_config = {
                  geo: { latitude, longitude, timezone },
                  location: { code, country, continent, city },
                };
              } else {
                throw new Error();
              }
            } catch(e) {
              return null;
            }
          }
        }
      }
    }
  }
  return geo_config;
};

const getMin = (climate_normals, key) =>
  Math.min(...climate_normals.map(cn => cn[key]));

const getMax = (climate_normals, key) =>
  Math.max(...climate_normals.map(cn => cn[key]));

const getTotal = (climate_normals, key) =>
  climate_normals.reduce((acc, cn) => acc + cn[key], 0);

const getAvg = (climate_normals, key) =>
  getTotal(climate_normals, key) / climate_normals.length;

const mergeClimateData = async geo_config => {
  try {
    if (geo_config && isPlainObject(geo_config)) {
      const { latitude: lat, longitude: lon } = geo_config.geo;
      geo_config.location.hemisphere = lat > 0 ? 'N' : 'S';

      const [climate_zone, climate_normals] = await Promise.all([
        fetchClimateZone(lat, lon), 
        getClimateNormals(lat, lon),
      ]);

      if (climate_zone.status === 'success') {
        geo_config.climate_zone = climate_zone.payload;
      }
      
      geo_config.climate_normals = climate_normals.reduce(
        (acc, val, i) => {
          const month = val.month - 1;
          const cl_normals = omit(val, ['month']);
          if (isNumber(cl_normals.tsun)) {
            const tsun_month = getAverageSunHours({ month, lat, lon });
            climate_normals[i].tsun = tsun_month;
            cl_normals.tsun = tsun_month;
          }
          return { ...acc, [month]: cl_normals };
        },
        {}
      );

      geo_config.climate_normals.general = {};

      if (every(climate_normals, cn => isNumber(cn.prcp))) {
        geo_config.climate_normals.general.pmin = getMin(climate_normals, 'prcp');
        geo_config.climate_normals.general.pmax = getMax(climate_normals, 'prcp');
        geo_config.climate_normals.general.pavg = getAvg(climate_normals, 'prcp');
        geo_config.climate_normals.general.ptotal = getTotal(climate_normals, 'prcp');
      }

      if (every(climate_normals, cn => isNumber(cn.tsun))) {
        geo_config.climate_normals.general.tsunmin = getMin(climate_normals, 'tsun');
        geo_config.climate_normals.general.tsunmax = getMax(climate_normals, 'tsun');
        geo_config.climate_normals.general.tsunavg = getAvg(climate_normals, 'tsun');
        geo_config.climate_normals.general.tsuntotal = getTotal(climate_normals, 'tsun');
      }

      if (every(climate_normals, cn => isNumber(cn.tmin))) {
        geo_config.climate_normals.general.tmin = getMin(climate_normals, 'tmin');
      }
      if (every(climate_normals, cn => isNumber(cn.tmax))) {
        geo_config.climate_normals.general.tmax = getMax(climate_normals, 'tmax');
      }
      if (every(climate_normals, cn => isNumber(cn.tavg))) {
        geo_config.climate_normals.general.tavg = getAvg(climate_normals, 'tavg');
      }

      if (isNumber(geo_config.climate_normals.general.tmin)) {
        const min_temp = geo_config.climate_normals.general.tmin;
        geo_config.hardiness_zone = getHardinessZone(min_temp);
      }

      const hemisphere = geo_config.location.hemisphere;
      geo_config.season = getSeason(hemisphere);

      return true;
    }
  } catch(e) {
    return false;
  }
}

const fetchGeo = async ({ ip, lat, lon } = {}) => {
  const geo_config = await (async () => {
    if (ip) { return fetchGeoByIp(ip); }
    if (lat && lon) { return fetchGeoByCoords(lat, lon); }
    return null;
  })();
  if (!geo_config) {
    return { status: 'error', error: 'Failed to fetch ip' };
  }
  const merged_climate_normals = await mergeClimateData(geo_config);
  if (!merged_climate_normals) {
    return { status: 'error', error: 'Failed to fetch climate normals' };
  }
  return { status: 'success', payload: geo_config };
};

module.exports = {
    fetchGeo,
};

(async () => {
  // require('fs').writeFileSync('sample-data/geo.json', JSON.stringify(await fetchGeo({ ip: '84.108.88.235' }), null, 2)); // holon
  // require('fs').writeFileSync('sample-data/geo.json', JSON.stringify(await fetchGeo({ lat: 31.011261, lon: 35.1 }), null, 2));
  // require('fs').writeFileSync('sample-data/geo.json', JSON.stringify(await fetchGeo({ lat: 29.425171, lon: -98.494614 }), null, 2)); // san antonio
  // require('fs').writeFileSync('sample-data/geo.json', JSON.stringify(await fetchGeo({ lat: 48.154, lon: -94.519 }), null, 2)); // holon
})();
