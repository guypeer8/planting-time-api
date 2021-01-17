const isDev = process.env.NODE_ENV === 'development';

const paypal = require('@paypal/checkout-server-sdk');

const clientId = isDev ? process.env.PAYPAL_SANDBOX_CLIENT_ID : process.env.PAYPAL_LIVE_CLIENT_ID;
const clientSecret = isDev ? process.env.PAYPAL_SANDBOX_SECRET : process.env.PAYPAL_LIVE_SECRET;

const env = `${isDev ? 'Sandbox' : 'Live'}Environment`;
const environment = new paypal.core[env](clientId, clientSecret);
const checkoutClient = new paypal.core.PayPalHttpClient(environment);

module.exports = checkoutClient;