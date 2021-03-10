const isEmpty = require('lodash/isEmpty');
const router = require('express').Router();

const UserModel = require('../../../../models/discriminators/user-discriminator');

/**
 * /api/users --> get users
 */
router.post('/', async (req, res) => {
    try {
        const { limit = 25 } = req.body;
        const users = await UserModel.getUsers(req.body);
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
        const { user_id: id } = req.params;
        const [user] = await UserModel.getUsers({ id });
        res.json({ status: 'success', payload: user });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/users --> create users
 */
router.put('/', async (req, res) => {
    try {
        const userRecord = new UserModel(req.body);
        const user = await userRecord.save();
        res.json({ status: 'success', payload: user });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

/**
 * /api/users --> update users
 */
router.put('/:user_id', async (req, res) => {
    try {
        const { user_id: _id } = req.params;
        const { ok, nModified } = await UserModel.update({ _id }, { $set: req.body });
        if (!ok || nModified !== 1) { throw new Error('Update failed!'); }
        const user = await UserModel.findOne({ _id });
        res.json({ status: 'success', payload: user });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});


/**
 * /api/users --> delete users
 */
router.delete('/', async (req, res) => {
    try {
        const { ids = [] } = req.body;
        if (isEmpty(ids)) { throw new Error('No ids passed!'); }
        const { ok } = await UserModel.deleteMany({ _id: { $in: ids } });
        if (!ok) { throw new Error('Delete failed!'); }
        res.json({ status: 'success', payload: [] });
    } catch(e) {
        console.log(e)
        res.json({ status: 'error', error: e });
    }
});

module.exports = router;