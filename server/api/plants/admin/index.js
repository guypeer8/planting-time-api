const isEmpty = require('lodash/isEmpty');
const router = require('express').Router();

const PlantModel = require('../../../../models/plant.model');

/**
 * /api/plants/melech --> get plants
 */
router.post('/', async (req, res) => {
    try {
        const { limit = 25 } = req.query;
        const plants = await PlantModel.getPlants({ ...req.body, withCompanions: false });

        const total_plants = await PlantModel.getPlants({ ...req.body, count: true });

        res.setHeader('Content-Range', `posts 0-${limit}/${total_plants}`);
        res.json({ status: 'success', payload: plants });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/plants/melech/:id_or_slug --> get plant
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
 * /api/melech/plants --> create plant
 */
router.put('/', async (req, res) => {
    
    try {
        const plantRecord = new PlantModel(req.body);
        const plant = await plantRecord.save();
        res.json({ status: 'success', payload: plant });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/plants/melech/:plant_id --> update plant
 */
router.put('/:plant_id', async (req, res) => {
    
    try {
        const { ok, nModified } = await PlantModel.update({ _id }, { $set: req.body });
        if (!ok || nModified !== 1) { throw new Error('Update failed!'); }
        const plant = await PlantModel.findOne({ _id });
        res.json({ status: 'success', payload: plant });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/plants/melech --> delete plants
 */
router.delete('/', async (req, res) => {
    try {
        const { ids = [] } = req.body;
        if (isEmpty(ids)) { throw new Error('No ids passed!'); }
        const { ok } = await PlantModel.deleteMany({ _id: { $in: ids } });
        if (!ok) { throw new Error('Delete failed!'); }
        res.json({ status: 'success', payload: [] });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

module.exports = router;