const { HEMISPHERE } = require('../hemisphere');
const { HARDINESS_ZONES } = require('../hardiness-zones');

const convertFahrenheitToCelsius = degrees => 
    ((degrees - 32) * 5 / 9);

const getSeasonMonth = (hemisphere, month) => {
    if (hemisphere === HEMISPHERE.NORTHERN) {
        return month;
    }
    return (month + 6) % 12;
};

const getHardinessZone = min_temp => {
    if (!min_temp) {
        return null;
    }
    for (const hzone in HARDINESS_ZONES) {
        const { from, to } = HARDINESS_ZONES[hzone];
        if (from <= min_temp && min_temp < to) {
            return hzone;
        }
    }
    return null;
};

module.exports = {
    convertFahrenheitToCelsius,
    getHardinessZone,
    getSeasonMonth,
};