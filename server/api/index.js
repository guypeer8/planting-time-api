const router = require('express').Router();

const geoRouter = require('./geo');
const authRouter = require('./auth');
const userRouter = require('./user');
const adminRouter = require('./admin');
const plantsRouter = require('./plants');

router.use('/geo', geoRouter);
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/admin', adminRouter);
router.use('/plants', plantsRouter);
router.get('/service-check', (_, res) => res.json({ status: 'ok' }));

module.exports = router;