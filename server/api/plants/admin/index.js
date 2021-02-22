const isEmpty = require('lodash/isEmpty');
const router = require('express').Router();

const PlantModel = require('../../../../models/plant.model');

/**
 * /api/plants/:plant_id --> create/update plant
 */
router.put('/:plant_id', async (req, res) => {
    try {
        const { plant_id: _id } = req.params;
        if (!_id) {
            const plantRecord = new PlantModel(req.body);
            const plant = await plantRecord.save();
            return res.json({ status: 'success', payload: plant });
        }
        const { ok, n, nModified } = await PlantModel.update({ _id }, { $set: req.body });
        const plant = await PlantModel.findOne({ _id });
        if (!ok || n !== 1 || nModified !== 1) { throw new Error('Update failed!'); }
        res.json({ status: 'success', payload: plant });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/plants/:plant_id --> update plant
 */
router.put('/:plant_id', async (req, res) => {
    try {
        const { plant_id: _id } = req.params;
        const { ok, n, nModified } = await PlantModel.update({ _id }, { $set: req.body });
        const plant = await PlantModel.findOne({ _id });
        if (!ok || n !== 1 || nModified !== 1) { throw new Error('Update failed!'); }
        res.json({ status: 'success', payload: plant });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/plants/ --> delete plants
 */
router.delete('/', async (req, res) => {
    try {
        const { ids = [] } = req.body;
        if (!isEmpty(ids)) { throw new Error('No ids passed!'); }
        const { ok } = await PlantModel.deleteMany({ _id: { $in: ids } });
        if (!ok) { throw new Error('Delete failed!'); }
        res.json({ status: 'success', payload: {} });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

module.exports = router;