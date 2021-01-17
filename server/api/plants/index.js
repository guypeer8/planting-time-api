const router = require('express').Router();

const PlantModel = require('../../../models/plant.model');
const { ensureLoggedIn } = require('../../middlewares/jwt');

/**
 * /api/plants --> get plants
 */
router.post('/', async (req, res) => {
    try {
        const plants = await PlantModel.getPlants(req.body);
        res.json({ status: 'success', payload: plants });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/plants/:plant_id/companions --> get plant companions
 */
router.post('/:plant_id/companions', ensureLoggedIn, async (req, res) => {
    try {
        const { plant_id } = req.params;
        const [plant] = await PlantModel.getPlants({ id: plant_id });
        const companions = await plant.getCompanions();
        res.json({ status: 'success', payload: companions });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

module.exports = router;