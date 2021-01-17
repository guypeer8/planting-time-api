const isEmpty = require('lodash/isEmpty');
const { convertFahrenheitToCelsius } = require('../utils');

const HARDINESS_ZONES = {};

const createHardinessZone = (from, to) => ({
    from: convertFahrenheitToCelsius(from), 
    to: convertFahrenheitToCelsius(to),
});

const createHardinessZonesMap = () => {
    if (!isEmpty(HARDINESS_ZONES)) {
        return HARDINESS_ZONES;
    }

    for (let i = 1; i <= 13; i++) {
        const zone_a_temp_f = -60 + (i-1) * 10;
        HARDINESS_ZONES[`${i}a`] = createHardinessZone(zone_a_temp_f, zone_a_temp_f + 5);
        HARDINESS_ZONES[`${i}b`] = createHardinessZone(zone_a_temp_f + 5, zone_a_temp_f + 10);
    }

    return HARDINESS_ZONES;
};

module.exports = {
    HARDINESS_ZONES: createHardinessZonesMap(),
};