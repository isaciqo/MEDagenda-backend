const leadSchema = require('./leadSchemas')();

module.exports = [
  {
    method: 'post',
    path: '/leads/clinic',
    handler: 'leadController.clinic',
    middlewares: [],
    validation: { body: leadSchema.clinicLead },
    swagger: {
      tags: ['Leads'],
      summary: 'Public contact form for clinics with multiple professionals interested in a custom plan',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'message'],
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                clinicName: { type: 'string' },
                professionalsCount: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Lead recorded and emailed' },
        400: { description: 'Validation error' },
      },
    },
  },
];
