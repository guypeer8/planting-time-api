const router = require('express').Router();
const { isDev } = require('../../../config');
const isIP = require('validator/lib/isIP');
const { fetchGeo } = require('../../utils/geo');

/**
 * /api/geo --> get by ip
 * /api/geo?lat=32&lon=35 --> get by coords
 */
router.get('/', async (req, res) => {
    const { lat, lon } = req.query;
    
    const ip = (() => {
        if (isDev) return '109.186.68.227';
        if (!req.ip || !isIP(req.ip)) return null;
        return req.ip;
    })();
    
    res.json(await fetchGeo({ ip, lat, lon }));
});

module.exports = router;