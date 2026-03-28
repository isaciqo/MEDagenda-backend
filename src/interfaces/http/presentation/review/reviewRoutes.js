const authMiddleware = require('../../middlewares/authMiddleware');
const reviewSchema = require('./reviewSchemas')();

module.exports = [
  {
    method: 'get',
    path: '/reviews',
    handler: 'reviewController.list',
    middlewares: [authMiddleware],
    validation: {},
    swagger: {
      tags: ['Reviews'],
      summary: 'List all reviews for the authenticated doctor',
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: 'List of reviews' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  {
    method: 'post',
    path: '/reviews',
    handler: 'reviewController.create',
    middlewares: [],
    validation: { body: reviewSchema.create },
    swagger: {
      tags: ['Reviews'],
      summary: 'Submit a patient review (public endpoint)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['appointmentId', 'rating', 'comment'],
              properties: {
                appointmentId: { type: 'string', format: 'uuid' },
                patientName: { type: 'string' },
                rating: { type: 'integer', minimum: 1, maximum: 5 },
                comment: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Review submitted' },
        400: { description: 'Validation error or duplicate review' },
        404: { description: 'Appointment not found' },
      },
    },
  },
];
