const authMiddleware = require('../../middlewares/authMiddleware');
const subscriptionSchema = require('./subscriptionSchemas')();

module.exports = [
  {
    method: 'post',
    path: '/subscriptions/checkout',
    handler: 'subscriptionController.checkout',
    middlewares: [authMiddleware],
    validation: { body: subscriptionSchema.checkout },
  },
  {
    method: 'post',
    path: '/subscriptions/portal',
    handler: 'subscriptionController.portal',
    middlewares: [authMiddleware],
    validation: {},
  },
];
