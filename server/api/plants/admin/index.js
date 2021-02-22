const isEmpty = require('lodash/isEmpty');
const router = require('express').Router();

const PlantModel = require('../../../../models/plant.model');

/**
 * /api/plants/:plant_id --> create/update plant
 */
router.put('/:plant_id', async (req, res) => {
    try {
        let plant = {};
        const { plant_id: _id } = req.params;
        if (!_id) {
            const plantRecord = new PlantModel(req.body);
            plant = await plantRecord.save();
        } else {
            const { ok, nModified } = await PlantModel.update({ _id }, { $set: req.body });
            if (!ok || nModified !== 1) { throw new Error('Update failed!'); }
            plant = await PlantModel.findOne({ _id });
        }
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
        if (isEmpty(ids)) { throw new Error('No ids passed!'); }
        const { ok } = await PlantModel.deleteMany({ _id: { $in: ids } });
        if (!ok) { throw new Error('Delete failed!'); }
        res.json({ status: 'success', payload: [] });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

module.exports = router;