const authMiddleware = require('../../middlewares/authMiddleware');

module.exports = [
  {
    method: 'post',
    path: '/subscriptions/checkout',
    handler: 'subscriptionController.checkout',
    middlewares: [authMiddleware],
    validation: {},
  },
  {
    method: 'post',
    path: '/subscriptions/portal',
    handler: 'subscriptionController.portal',
    middlewares: [authMiddleware],
    validation: {},
  },
];
