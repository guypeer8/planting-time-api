const router = require('express').Router();

const { fetchGeo } = require('../../utils/geo');

/**
 * /api/geo --> get by ip
 * /api/geo?lat=32&lon=35 --> get by coords
 */
router.get('/', async (req, res) => {
    const { ip } = req;
    const { lat, lon } = req.query;
    res.json(await fetchGeo({ ip, lat, lon }));
});

module.exports = router;