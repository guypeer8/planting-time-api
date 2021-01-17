const get = require('lodash/get');
const router = require('express').Router();
const paypal = require('@paypal/checkout-server-sdk');

const checkoutClient = require('./client');
const { TEMPLATE_PRICES } = require('../../config');
const { templateModels } = require('../../config/models');

router.post('/order', async (req, res) => {
    const { type, name } = req.body;
    const price = get(TEMPLATE_PRICES, `${type}.${name}`, null);

    try {
        if (!price) { 
            throw new Error('Parameters can\'t be processed.');
        }

        const request = new paypal.orders.OrdersCreateRequest();
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{ amount: { currency_code: 'USD', value: price } }],
            application_context: { shipping_preference: 'NO_SHIPPING' },
        });

        const order = await checkoutClient.execute(request);
        if (order.result.status !== 'CREATED') { 
            throw new Error('Failed to create order.');
        }
        
        res.json({ 
            status: 'success',
            payload: { orderId: order.result.id },
        });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

router.post('/capture', async (req, res) => {
    const { _id } = req.userData;
    const { templateType } = req.query;
    const { orderId, templateId } = req.body;

    try {
        if (!orderId) { 
            throw new Error('Order ID is missing.');
        }

        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        const capture = await checkoutClient.execute(request);
        if (capture.result.status !== 'COMPLETED') {
            throw new Error('Failed to complete order. Payment has not been processed.');
        }

        const captureMap = get(capture, 'result.purchase_units[0].payments.captures[0]', null);
        if (!captureMap) {
            throw new Error('Payment could not be processed.');
        }

        const Model = templateModels[templateType];
        const paymentDetails = {
            orderId: capture.result.id,
            captureId: captureMap.id,
            paidAt: captureMap.create_time,
            payer: capture.result.payer,
            amount: captureMap.amount,
        };

        const updateResponse = await Model.update(
            { user: _id, ...(templateId ? { _id: templateId } : {}) }, 
            { $set: { paymentDetails } },
            { upsert: true }
        );

        res.json({ 
            status: 'success', 
            payload: { 
                templateId: templateId || get(updateResponse, 'upserted[0]._id', null),
            },
        });
    } catch(e) {
        res.json({ status: 'error', error: e });
    }
});

module.exports = router;