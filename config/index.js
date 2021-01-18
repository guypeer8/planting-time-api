require('dotenv').config();

const isDev = process.env.NODE_ENV !== 'production';

const sample = require('lodash/sample');
const appRootDir = require('app-root-dir').get();

const PORT = 8080;
const PROVIDERS = ['google', 'facebook', 'github', 'linkedin'];

const IPAPI_API = `https://ipapi.co/{{IP}}/json/`;
const FREE_GEOIP = 'https://freegeoip.app/json/{{IP}}';
const IPGEOLOCATION_API = `https://api.ipgeolocationapi.com/geolocate/{{IP}}`;
const IPSTACK_API = `http://api.ipstack.com/{{IP}}?access_key=${sample(Array.from({ length: 2 }).map((_, i) => process.env[`IP_STACK_KEY_${i+1}`]))}`;

const MAPBOX_API = 'https://api.mapbox.com';
const HERE_API = `https://revgeocode.search.hereapi.com/v1/revgeocode`;
const MAPQUEST_REVERSE_GEO_API = `http://open.mapquestapi.com/geocoding/v1/reverse`;

const SUNLIGHT_API = 'https://api.sunrise-sunset.org/json';

const frontendRoute = isDev ? 'http://localhost:8888' : 'https://plantingtime.com';
const backendRoute = isDev ? 'http://localhost:8080' : 'https://api.plantingtime.com';
const mongodbServer = isDev ? 'mongodb://localhost:27017/plantingtime' : process.env.MONGO_URI;

const corsOptions = isDev ? {} : { origin: frontendRoute, optionsSuccessStatus: 200 };

module.exports = {
    PORT,
    PROVIDERS,
    appRootDir,
    isDev,
    frontendRoute,
    backendRoute,
    mongodbServer,
    corsOptions,
    IPAPI_API,
    FREE_GEOIP,
    IPSTACK_API,
    IPGEOLOCATION_API,
    MAPQUEST_REVERSE_GEO_API,
    MAPBOX_API,
    HERE_API,
    SUNLIGHT_API,
};