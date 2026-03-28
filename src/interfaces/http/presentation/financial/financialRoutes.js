const authMiddleware = require('../../middlewares/authMiddleware');

module.exports = [
  {
    method: 'get',
    path: '/financial/summary',
    handler: 'financialController.summary',
    middlewares: [authMiddleware],
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
      },
    },
  },
];
