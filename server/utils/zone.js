const axios = require('axios');
const trim = require('lodash/trim');
const first = require('lodash/first');
const { SEASONS } = require('@planting-time/constants/seasons');

const CLIMATE_API = 'http://climateapi.scottpinkelman.com/api/v1/location';

const zone_map = {
    A: 'Tropical',
    B: 'Dry',
    C: 'Moderate',
    D: 'Continental',
    E: 'Polar',
};

const fetchClimateZone = async (lat, lon) => {
    try {
        const { data: { error, return_values } } = await axios.get(`${CLIMATE_API}/${lat}/${lon}`);
        if (error) {
            throw new Error(error);
        }
        if (return_values[0]) {
            const { 
                koppen_geiger_zone: kg_zone, 
                zone_description: desc,
            } = return_values[0];
            const payload = { 
                zone_type: '', 
                kg_zone,
                desc,
                short_desc: trim(first(desc.split(','))), 
            };
            if (kg_zone && kg_zone.length > 0) {
                payload.zone_type = zone_map[first(kg_zone)];
            }
            return { status: 'success', payload };
        }
        throw new Error('Empty response');
    } catch(e) {
        return { status: 'error', error: e };
    }
};

const getClimateZoneMetrics = climate_normals => ({
    Af: {
        tmin: { gt: 18 },
        pmin: { gt: 60 },
    },
    Am: {
        tmin: { gt: 18 },
        ptotal: { gt: 25 * (100 - climate_normals.general.pmin) },
    },
    As: {
        tmin: { gt: 18 },
        pmin: { lt: 60, season: SEASONS.SUMMER },
    },
    Aw: {
        tmin: { gt: 18 },
        pmin: { lt: 60, season: SEASONS.WINTER },
    },
    Cfa: {
        tmin: { lt: 18, gt: -3 },
    },
    Cfb: {
        tmin: { lt: 18, gt: -3 },
    },
    Cfc: {
        tmin: { lt: 18, gt: -3 },
    },
    Csa: {
        tmin: { lt: 18, gt: -3 },
    },
    Csb: {
        tmin: { lt: 18, gt: -3 },
    },
    Cwa: {
        tmin: { lt: 18, gt: -3 },
    },
    Ds: {
        tmin: { lt: -3 },
    },
    Dw: {
        tmin: { lt: -3 },
    },
    Df: {
        tmin: { lt: -3 },
    },
    ET: {
        tmax: { lt: 10, gt: 0 },
    },
    EF: {
        tmax: { lt: 0 },
    },
});

module.exports = {
    fetchClimateZone,
    getHardinessZone,
    getClimateZoneMetrics,
};