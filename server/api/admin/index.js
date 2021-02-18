const isEmpty = require('lodash/isEmpty');
const router = require('express').Router();

const PlantModel = require('../../../models/plant.model');
const { ensureLoggedIn, ensureAdmin } = require('../../middlewares/jwt');

router.get('/plants', async (req, res) => {
    try {
        const { limit = 30 } = req.query;
        const plants = await PlantModel.getPlants(req.body);
        const total_plants = await PlantModel.count();
        res.setHeader('Content-Range', `posts 0-${limit}/${total_plants}`);
        res.json(plants);
    } catch(e) {
        res.json(e);
    }
});

router.get('/plants/:plant_id', async (req, res) => {
    try {
        const { plant_id } = req.params;
        const [plant] = await PlantModel.getPlants({ id: plant_id });
        res.json(plant);
    } catch(e) {
        res.json(e);
    }
});

module.exports = router;