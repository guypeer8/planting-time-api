const router = require('express').Router();

const { fetchClimateZone } = require('../../utils/zone');

/**
 * /api/climate-zone --> get kg zone classification data
 */
router.get('/climate-zone', async (req, res) => {
    const { lat, lon } = req.query;
    res.json(await fetchClimateZone(lat, lon));
});

module.exports = router;