const authMiddleware = require('../../middlewares/authMiddleware');
const Joi = require('joi');

const routes = [
  {
    method: 'get',
    path: '/referral/stats',
    handler: 'referralController.getStats',
    middlewares: [authMiddleware],
    validation: {},
  },
];

if (process.env.NODE_ENV !== 'production') {
  routes.push({
    method: 'post',
    path: '/referral/dev/seed',
    handler: 'referralController.seed',
    middlewares: [],
    validation: {
      body: Joi.object({
        referralCode: Joi.string().length(8).uppercase().required(),
        count: Joi.number().integer().min(1).max(20).default(1),
      }),
    },
  });

}

module.exports = routes;
