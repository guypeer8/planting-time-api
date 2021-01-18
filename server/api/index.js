const router = require('express').Router();

const geoRouter = require('./geo');
const authRouter = require('./auth');
const userRouter = require('./user');
const plantsRouter = require('./plants');

const { ensureLoggedIn } = require('../middlewares/jwt');

router.use('/geo', geoRouter);
router.use('/auth', authRouter);
router.use('/plants', plantsRouter);

router.get('/service-check', (_, res) => {
    res.json({ status: 'ok' });
});

router.use('/user', ensureLoggedIn, userRouter);

module.exports = router;