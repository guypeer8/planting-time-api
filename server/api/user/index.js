const router = require('express').Router();

const adminRouter = require('./admin');
const gardenRouter = require('./garden');
const profileRouter = require('./profile');
const { ensureLoggedIn, ensureAdmin } = require('../../middlewares/jwt');

router.use(ensureLoggedIn);
router.use('/garden', gardenRouter);
router.use('/profile', profileRouter);

router.use(ensureAdmin);
router.use('/', adminRouter);

module.exports = router;