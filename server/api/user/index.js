const router = require('express').Router();

const gardenRouter = require('./garden');
const profileRouter = require('./profile');
const { ensureLoggedIn } = require('../../middlewares/jwt');

router.use(ensureLoggedIn);
router.use('/garden', gardenRouter);
router.use('/profile', profileRouter);

module.exports = router;