const isEmpty = require('lodash/isEmpty');
const router = require('express').Router();

const PlantModel = require('../../../models/plant.model');
const { ensureLoggedIn } = require('../../middlewares/jwt');


router.get('/plants', async (req, res) => {
    try {
        const plants = await PlantModel.getPlants(req.body);
        res.setHeader('Content-Range', "posts 0-30/128");
        res.json(plants);
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

router.get('/plants/:plant_id', async (req, res) => {
    try {
        const { plant_id } = req.params;
        const [plant] = await PlantModel.getPlants({ id: plant_id });
        res.json(plant);
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

module.exports = router;