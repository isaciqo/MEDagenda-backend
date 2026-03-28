const authMiddleware = require('../../middlewares/authMiddleware');
const settingsSchema = require('./settingsSchemas')();

module.exports = [
  {
    method: 'get',
    path: '/settings',
    handler: 'settingsController.get',
    middlewares: [authMiddleware],
    validation: {},
    swagger: {
      tags: ['Settings'],
      summary: 'Get doctor settings (profile, schedule, templates)',
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: 'Doctor settings' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  {
    method: 'put',
    path: '/settings',
    handler: 'settingsController.update',
    middlewares: [authMiddleware],
    validation: { body: settingsSchema.update },
    swagger: {
      tags: ['Settings'],
      summary: 'Update doctor settings',
      security: [{ BearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                specialty: { type: 'string' },
                photoUrl: { type: 'string' },
                whatsappTemplate: { type: 'string' },
                defaultDuration: { type: 'integer', minimum: 5, maximum: 240 },
                schedule: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated settings' },
        401: { description: 'Unauthorized' },
      },
    },
  },
];
