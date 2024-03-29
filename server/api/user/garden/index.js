const first = require('lodash/first');
const router = require('express').Router();

const { enrichPlants } = require('../../../utils/plant');
const GardenModel = require('../../../../models/garden.model');
const UserPlantModel = require('../../../../models/user-plant.model');

/**
 * /api/user/garden --> get user gardens
 */
router.get('/', async (req, res) => {
    try {
        const { name } = req.body;
        const { limit = 20, sort = 'name' } = req.query;

        if (!name) { throw new Error('A garden must have a name'); }

        const user = req.user_auth._id;

        const gardens = await GardenModel.getGardens({ user, limit, sort });

        res.json({ status: 'success', payload: gardens });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/user/garden --> create user garden
 */
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        const user = req.user_auth._id;

        if (!name) { throw new Error('A garden must have a name'); }

        const name_exists = await GardenModel.exists({ user, name });
        if (name_exists) { throw new Error(`Garden named "${name}" already exists`); }

        const gardenRecord = new GardenModel({ user, name });
        const garden = await gardenRecord.save();

        res.json({ status: 'success', payload: garden });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/user/garden:garden_id --> delete user garden
 */
router.delete('/', async (req, res) => {
    try {
        const user = req.user_auth._id;
        const { garden_id: garden } = req.params;
        await Promise.all([
            UserPlantModel.deleteMany({ user, garden }),
            GardenModel.remove({ user, _id: garden }),
        ]);
        res.json({ status: 'success', payload: {} });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/user/garden/:garden_id/plants --> get user garden plants
 */
router.get('/:garden_id/plants', async (req, res) => {
    try {
        const user = req.user_auth._id;

        const { lat } = req.query;
        const { garden_id: garden } = req.params;
        const { limit = 30, sort = 'metadata.common_name' } = req.body;

        const gardenPlants = await UserPlantModel
            .find({ user, garden })
            .select('-user -garden')
            .populate({
                path: 'plant',
                options: { limit, sort },
                match: { searchable: true },
                select: ['metadata', 'attributes.plant_type', 'calendar', 'slug'].join(' '),
            })
            .lean();

        gardenPlants.forEach(gp => {
            gp.plant = first(enrichPlants([gp.plant], lat));
        });

        res.json({ status: 'success', payload: gardenPlants });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/user/garden/:garden_id/plants/:plant_id --> create user garden plant
 */
router.post('/:garden_id/plants/:plant_id', async (req, res) => {
    try {
        const user = req.user_auth._id;

        const { lat } = req.query;
        const { garden_id: garden, plant_id: plant } = req.params;
        const { limit = 30, sort = 'metadata.common_name' } = req.body;

        const userPlantRecord = new UserPlantModel({ user, garden, plant });
        await userPlantRecord.save();
        
        const userPlant = await UserPlantModel
            .findOne({ user, garden, plant })
            .select('-user -garden')
            .populate({
                path: 'plant',
                options: { limit, sort },
                match: { searchable: true },
                select: ['metadata', 'attributes.plant_type', 'calendar', 'slug'].join(' '),
            })
            .lean();

        userPlant.plant = first(enrichPlants([userPlant.plant], lat));

        res.json({ status: 'success', payload: userPlant });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/user/garden/:garden_id/plants/:plant_id --> delete user plant
 */
router.delete('/:garden_id/plants/:plant_id', async (req, res) => {
    try {
        const user = req.user_auth._id;
        const { garden_id: garden, plant_id: plant } = req.params;
        await UserPlantModel.remove({ user, garden, plant });
        res.json({ status: 'success', payload: {} });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

module.exports = router;