const authMiddleware = require('../../middlewares/authMiddleware');

module.exports = [
  {
    method: 'get',
    path: '/dashboard/stats',
    handler: 'dashboardController.stats',
    middlewares: [authMiddleware],
    validation: {},
    swagger: {
      tags: ['Dashboard'],
      summary: 'Get dashboard statistics',
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: 'Dashboard stats including appointments, revenue, and distributions' },
        401: { description: 'Unauthorized' },
      },
    },
  },
];
