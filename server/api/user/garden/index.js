const router = require('express').Router();

const GardenModel = require('../../../../models/garden.model');
const UserPlantModel = require('../../../../models/user-plant.model');

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
            UserPlantModel.remove({ user, garden }),
            GardenModel.remove({ user, _id: garden }),
        ]);
        res.json({ status: 'success', payload: {} });
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
        const { garden_id: garden, plant_id: plant } = req.params;
        const userPlantRecord = new UserPlantModel({ user, garden, plant });
        const userPlant = await userPlantRecord.save();
        res.json({ status: 'success', payload: userPlant });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/user/garden/:garden_id/plants/:plant_id --> delete user plant
 */
router.delete('/', async (req, res) => {
    try {
        const user = req.user_auth._id;
        const { garden_id: garden, plant_id: plant } = req.params;
        await UserPlantModel.remove({ user, garden, plant });
        res.json({ status: 'success', payload: userPlant });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

module.exports = router;