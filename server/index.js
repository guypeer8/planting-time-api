require('dotenv').config();

const cors = require('cors');
const helmet = require('helmet');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const slowDown = require('express-slow-down');
const rateLimit = require('express-rate-limit');

const apiRoute = require('./api');
const { jwtMiddleware } = require('./middlewares');
const { mongodbServer, corsOptions, PORT } = require('../config');

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
});

const apiSpeedLimiter = slowDown({
    windowMs: 60 * 1000, 
    delayAfter: 100,
    delayMs: 1000,
});

mongoose.connect(mongodbServer, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});

const createApp = () => {
    const app = express();

    app.use(helmet({ xssFilter: { setOnOldIE: false } }));

    app.use(cors(corsOptions));

    app.use(compression());

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(cookieParser());
    app.use(passport.initialize());
    app.use(jwtMiddleware);
    
    app.use('/api', apiLimiter, apiSpeedLimiter, apiRoute);

    return app;
};


const runApp = app => {

    app.listen(PORT, err => {
        if (err) { return console.warn(err); }
        console.info(`Listening on port ${PORT}!`);
    });
};

module.exports = {
    createApp,
    runApp,
};