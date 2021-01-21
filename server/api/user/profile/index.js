const router = require('express').Router();

const { verifyEmail } = require('../../../utils/validation');

router.post('/save-email', async (req, res) => {
    const { email = '' } = req.body;
    res.json(await verifyEmail(req.userData, email, { saveIfValid: true }));
});

module.exports = router;