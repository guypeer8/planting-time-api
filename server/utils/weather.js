require('dotenv').config();

const axios = require('axios');
const SunCalc = require('suncalc');
const sample = require('lodash/sample');
const Meteostat = require('meteostat').default;
const { MONTHS } = require('@planting-time/constants/months');
const { SEASONS_MAP } = require('@planting-time/constants/seasons');

const { SUNLIGHT_API } = require('../../config');

const BASE_ENDPOINT = 'https://api.openweathermap.org';

const WEATHER_ICON_SRC = `http://openweathermap.org/img/wn/{{ICON_ID}}@2x.png`;

const owm_api_keys = Array.from({ length: 4 }).map((_, i) => process.env[`OPEN_WEATHER_MAP_KEY_${i+1}`]);
const meteostat_api_keys = Array.from({ length: 5 }).map((_, i) => process.env[`METEOSTAT_KEY_${i+1}`]);

const getDaysBackUnixTime = (number_of_days = 1, dt = Date.now()) => {
    return Math.round(((dt - number_of_days*24*60*60*1000) / 1000));
};

const createEndpoint = (type, params = '') => {
    const api_key = sample(owm_api_keys);
    switch(type) {
        case 'data':
            return `${BASE_ENDPOINT}/data/2.5/weather?appid=${api_key}&units=metric${params}`;
        case 'onecall':
            return `${BASE_ENDPOINT}/data/2.5/onecall?appid=${api_key}&units=metric${params}`;
        case 'historical':
            return `${BASE_ENDPOINT}/data/2.5/onecall/timemachine?appid=${api_key}&units=metric${params}`;
        default:
            return BASE_ENDPOINT;
    }
};

const getCurrentWeather = async (lat, lon) => {
    try {
        const current_weather_endpoint = createEndpoint('data', `&lat=${lat}&lon=${lon}`);
        const { data } = await axios.get(current_weather_endpoint);
        require('fs').writeFileSync('sample-data/weather.json', JSON.stringify(data,null,2))
    } catch(e) {
        console.log(e)
    }
};

const getHistoricalWeather = async (lat, lon, days = 5) => {
    try {
        const historical_weather_endpoint = createEndpoint('historical', `&lat=${lat}&lon=${lon}&dt=${getDaysBackUnixTime(days)}`);
        const { data } = await axios.get(historical_weather_endpoint);
    } catch(e) {
        console.log(e)
    }
};

const getClimateNormals = async (lat, lon) => {
    const meteostat = new Meteostat(sample(meteostat_api_keys));
    try {
        const climate_normals = await meteostat.point.climate({ lat, lon });
        return climate_normals;
    } catch (e) {
        return e;
    }
};

const getWeatherIcon = icon_id => 
    WEATHER_ICON_SRC.replace('{{ICON_ID}}', icon_id);

const fetchSunlightParams = async (lat, lon) => {
    try {
        const { data } = await axios.get(`${SUNLIGHT_API}?lat=${lat}&lng=${lon}`);
        if (data && data.status === 'OK' && data.results) {
            return data.results;
        } 
    } catch(e) {}
    return null;
};

const getSunTime = ({ month, day, lat, lon } = {}) => {
    const date = new Date(`${month+1}-${day}-2021`);
    const times = SunCalc.getTimes(date, lat, lon);
    const sunset_ms = new Date(times.sunsetStart).getTime();
    const sunrise_ms = new Date(times.sunriseEnd).getTime();    
    const daylight_time = sunset_ms - sunrise_ms;
    return daylight_time/1000/60/60;  
}
  
const getAverageSuntime = ({ month, lat, lon } = {}) => {
    const days_in_month = MONTHS[month].days;
    const months = Array.from({ length: days_in_month }).map((_, i) => i+1);
    const daylight_hours_sum = months.reduce((acc, day) => acc + getSunTime({ month, day, lat, lon }), 0);
    return daylight_hours_sum / days_in_month;
}

const getSeason = hemisphere => {
    return SEASONS_MAP[hemisphere][new Date().getMonth()];
};

const getClimacellData = async (lat, lon) => {
    try {
        const historical_weather_endpoint = `https://data.climacell.co/v4/timelines?location=${lat}%2C${lon}&fields=temperature,humidity,solarGHI&startTime=${new Date('01-01-2000').toISOString()}&apikey=${process.env.CLIMACELL_KEY_1}`;
        const { data } = await axios.get(historical_weather_endpoint);
        console.log(JSON.stringify(data,null,2))
    } catch(e) {}
    return null;
};

module.exports = {
    getCurrentWeather,
    getHistoricalWeather,
    getClimateNormals,
    getWeatherIcon,
    getSunTime,
    getAverageSuntime,
    fetchSunlightParams,
    getSeason,
};

// (async () => {
    // await getClimacellData(44.9518, -93.4339);
    // await getCurrentWeather(31.768318, 35.213711);
    // console.log(await getSunlight(31.768318, 35.213711));
// })();