const router = require('express').Router();
const isIP = require('validator/lib/isIP');

const { isDev } = require('../../../config');
const { fetchGeo } = require('../../utils/geo');

/**
 * /api/geo --> get by ip
 * /api/geo?place={place} --> get by place
 * /api/geo?lat=32&lon=35 --> get by coords
 */
router.get('/', async (req, res) => {
    const { lat, lon, place } = req.query;
    
    const ip = (() => {
        if (isDev) return '84.108.88.235';
        if (!req.ip || !isIP(req.ip)) return null;
        return req.ip;
    })();
    
    res.json(await fetchGeo({ ip, place, lat, lon }));
});

module.exports = router;