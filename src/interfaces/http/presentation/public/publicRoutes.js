const Joi = require('joi');

const rescheduleSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
});

const reviewSchema = Joi.object({
  patientName: Joi.string().optional().allow('', null),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().required(),
});

module.exports = [
  {
    method: 'post',
    path: '/public/confirm/:token',
    handler: 'publicController.confirm',
    middlewares: [],
    validation: {},
    swagger: {
      tags: ['Public'],
      summary: 'Confirm appointment via patient link',
      parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Appointment confirmed' },
        400: { description: 'Invalid or expired token' },
      },
    },
  },
  {
    method: 'get',
    path: '/public/slots/:token',
    handler: 'publicController.slots',
    middlewares: [],
    validation: {},
    swagger: {
      tags: ['Public'],
      summary: 'Get available slots for rescheduling via patient link',
      parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Available slots' },
        400: { description: 'Invalid or expired token' },
      },
    },
  },
  {
    method: 'post',
    path: '/public/reschedule/:token',
    handler: 'publicController.reschedule',
    middlewares: [],
    validation: { body: rescheduleSchema },
    swagger: {
      tags: ['Public'],
      summary: 'Reschedule appointment via patient link',
      parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['date', 'time'],
              properties: {
                date: { type: 'string', example: '2025-08-20' },
                time: { type: 'string', example: '10:00' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Appointment rescheduled' },
        400: { description: 'Invalid token or slot unavailable' },
      },
    },
  },
  {
    method: 'get',
    path: '/public/review/:token',
    handler: 'publicController.reviewInfo',
    middlewares: [],
    validation: {},
    swagger: {
      tags: ['Public'],
      summary: 'Get appointment info for review form',
      parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Appointment info' } },
    },
  },
  {
    method: 'post',
    path: '/public/review/:token',
    handler: 'publicController.submitReview',
    middlewares: [],
    validation: { body: reviewSchema },
    swagger: {
      tags: ['Public'],
      summary: 'Submit a review via patient link',
      parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['rating', 'comment'],
              properties: {
                patientName: { type: 'string' },
                rating: { type: 'integer', minimum: 1, maximum: 5 },
                comment: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 201: { description: 'Review submitted' } },
    },
  },
];
