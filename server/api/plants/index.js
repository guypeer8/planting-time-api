const isEmpty = require('lodash/isEmpty');
const router = require('express').Router();

const adminRouter = require('./admin');
const PlantModel = require('../../../models/plant.model');
const { ensureLoggedIn, ensureAdmin } = require('../../middlewares/jwt');

/**
 * /api/plants --> get plants
 */
router.post('/', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const plants = await PlantModel.getPlants(req.body);

        const total_plants = await PlantModel.getPlants({ ...req.body, count: true });

        res.setHeader('Content-Range', `posts 0-${limit}/${total_plants}`);
        res.json({ status: 'success', payload: plants });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/plants/:id_or_slug --> get plant
 */
router.get('/:id_or_slug', async (req, res) => {
    try {
        const { id_or_slug } = req.params;
        const key = /\d/.test(id_or_slug) ? 'id' : 'slug';
        const query = { 
            [key]: id_or_slug, 
            withCompanions: true,
            select: ['metadata.common_name'],
        };
        const [plant] = await PlantModel.getPlants(query);
        res.json({ status: 'success', payload: plant });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * ENSURE LOGGED IN
 */

router.use(ensureLoggedIn);

/**
 * /api/plants/companions --> get plants companions
 */
router.post('/companions', async (req, res) => {
    try {
        const { plant_ids } = req.body;
        if (isEmpty(plant_ids)) { throw new Error('No plant ids'); }
        const plants = await PlantModel.getPlants({ ids: plant_ids });
        const companions = await Promise.all(plants.map(p => p.getCompanions()));
        res.json({ status: 'success', payload: companions });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/plants/:plant_id/companions --> get plant companions
 */
router.post('/:plant_id/companions', async (req, res) => {
    try {
        const { plant_id } = req.params;
        const [plant] = await PlantModel.getPlants({ id: plant_id, lean: false });
        const companions = await plant.getCompanions();
        res.json({ status: 'success', payload: companions });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * ENSURE ADMIN
 */
router.use(ensureAdmin);

/**
 * /api/plants --> plant admin actions
 */
router.use(adminRouter);

module.exports = router;