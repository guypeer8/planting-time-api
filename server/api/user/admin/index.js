const router = require('express').Router();

const UserModel = require('../../../../models/user.model');

/**
 * /api/users --> get users
 */
router.post('/', async (req, res) => {
    try {
        const { email, limit = 30 } = req.body;
        const users = await UserModel.find(email ? {email} : {});
        const total_users = await UserModel.countDocuments();
        res.setHeader('Content-Range', `posts 0-${limit}/${total_users}`);
        res.json({ status: 'success', payload: users });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/users/:user_id --> get user
 */
router.get('/:user_id', async (req, res) => {
    try {
        const { user_id: _id } = req.params;
        const user = await UserModel.findOne({ _id });
        res.json({ status: 'success', payload: user });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/users/garden/:garden_id --> delete user garden
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