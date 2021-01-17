require('dotenv').config();

const { createApp, runApp } = require('./server');

const app = await createApp();

runApp(app);