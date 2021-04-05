const { isGoodToPlant, isGoodToSeed, getCalendarSeasons } = require('@planting-time/constants/utils/calendar');

const enrichPlants = (plants, lat = null) => {
    plants.forEach(plant => {
        plant.isGoodToPlant = isGoodToPlant(plant.calendar, plant.attributes.plant_type, { lat });
        plant.isGoodToSeed = isGoodToSeed(plant.calendar, plant.attributes.plant_type, { lat });
        plant.seasons = getCalendarSeasons(plant.calendar, { lat });
    });
    return plants;
};

module.exports = {
    enrichPlants,
};