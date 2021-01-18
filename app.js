require('dotenv').config();

const { createApp, runApp } = require('./server');

const app = createApp();

runApp(app);