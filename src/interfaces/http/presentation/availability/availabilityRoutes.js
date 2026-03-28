const authMiddleware = require('../../middlewares/authMiddleware');

module.exports = [
  {
    method: 'get',
    path: '/availability/slots',
    handler: 'availabilityController.slots',
    middlewares: [authMiddleware],
    validation: {},
    swagger: {
      tags: ['Availability'],
      summary: 'Get available appointment slots based on doctor schedule',
      security: [{ BearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'from', schema: { type: 'string' }, description: 'Start date (YYYY-MM-DD)' },
        { in: 'query', name: 'to', schema: { type: 'string' }, description: 'End date (YYYY-MM-DD)' },
      ],
      responses: {
        200: { description: 'List of available slots' },
        401: { description: 'Unauthorized' },
      },
    },
  },
];
