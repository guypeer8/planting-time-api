const isEmpty = require('lodash/isEmpty');
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
 * /api/plants/companions --> get plants companions
 */
router.post('/companions', ensureLoggedIn, async (req, res) => {
    try {
        const { plant_ids } = req.body;
        if (isEmpty(plant_ids)) {
            throw new Error('No plant ids');
        }
        const plants = await PlantModel.getPlants({ ids: plant_ids });
        const companions = await Promise.all(
            plants.map(p => 
                p.getCompanions({ select_fields: ['growth.days_to_maturity'] })
            )
        );
        res.json({ status: 'success', payload: companions });
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
        const companions = await plant.getCompanions({ 
            select_fields: ['growth.days_to_maturity'],
        });
        res.json({ status: 'success', payload: companions });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

module.exports = router;