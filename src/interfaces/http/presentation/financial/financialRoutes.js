const authMiddleware = require('../../middlewares/authMiddleware');
const planFeatureMiddleware = require('../../middlewares/planFeatureMiddleware');

module.exports = [
  {
    method: 'get',
    path: '/financial/summary',
    handler: 'financialController.summary',
    middlewares: [authMiddleware, planFeatureMiddleware('financeiro_completo')],
    validation: {},
    swagger: {
      tags: ['Financial'],
      summary: 'Get financial summary for a period',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: { type: 'string', enum: ['semana', 'mes', 'trimestre', 'ano'] },
          description: 'Period filter (default: mes)',
        },
      ],
      responses: {
        200: { description: 'Financial summary' },
        401: { description: 'Unauthorized' },
        402: { description: 'Plan required' },
      },
    },
  },
];
