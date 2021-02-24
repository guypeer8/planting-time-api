require('dotenv').config();

const open = require('open');
const map = require('map-series');
const express = require('express');
const mongoose = require('mongoose');
const Youtube = require('youtube-api');
 
const { mongodbServer } = require('../../config');
const PlantModel = require('../../models/plant.model');

mongoose.connect(mongodbServer, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});

const PORT = 5000;

const app = express();
 
const oauth = Youtube.authenticate({
    type: 'oauth', 
    client_id: process.env.YOUTUBE_CLIENT_ID, 
    client_secret: process.env.YOUTUBE_CLIENT_SECRET, 
    redirect_url: 'http://localhost:5000/oauth2callback',
});
 
open(oauth.generateAuthUrl({
    access_type: 'offline', 
    scope: ['https://www.googleapis.com/auth/youtube.readonly'],
}));
 
// Handle oauth2 callback
app.get('/oauth2callback', (req, res) => {
    const { code } = req.query;

    oauth.getToken(code, async (err, tokens) => {
        if (err) { return console.error(err); }
        
        oauth.setCredentials(tokens);

        try {
            const plants_count = await PlantModel.countDocuments();
            const plants = await PlantModel.getPlants({
                limit: plants_count,
                withCompanions: false,
                select_fields: ['metadata.common_name'],
                extended_query: { videos: { $size: 0 } },
            });

            const errors = [];
            map(plants, (plant, cbk) => {
                setTimeout(async () => {
                    const { _id, metadata } = plant;
                    try {
                        const { data } = await Youtube.search.list({
                            part: 'snippet',
                            maxResults: 10,
                            q: `How to grow ${metadata.common_name}`, 
                        });
                        const videos = data.items.map(({ id, snippet }) => ({
                            title: snippet.title,
                            thumbnails: snippet.thumbnails,
                            created_at: snippet.publishedAt,
                            description: snippet.description,
                            url: `https://youtube.com/watch?v=${id.videoId}`,
                        }));
                        await PlantModel.updateOne({ _id }, { $set: { videos } });
                    } catch(e) {
                        errors.push({ _id, e });
                    }
                    cbk();
                }, 1200);
            }, () => {
                console.log(errors);
            });
        } catch(e) {
            console.warn(e);
        }
    });
});

app.listen(PORT, err => {
    if (err) { return console.warn(err); }
    console.info(`Listening on port ${PORT}!`);
});