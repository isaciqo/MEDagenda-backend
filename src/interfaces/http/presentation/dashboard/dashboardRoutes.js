const authMiddleware = require('../../middlewares/authMiddleware');
const planFeatureMiddleware = require('../../middlewares/planFeatureMiddleware');

module.exports = [
  {
    method: 'get',
    path: '/dashboard/stats',
    handler: 'dashboardController.stats',
    middlewares: [authMiddleware, planFeatureMiddleware('dashboard_metrics')],
    validation: {},
    swagger: {
      tags: ['Dashboard'],
      summary: 'Get dashboard statistics',
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: 'Dashboard stats including appointments, revenue, and distributions' },
        401: { description: 'Unauthorized' },
        402: { description: 'Plan required' },
      },
    },
  },
];
