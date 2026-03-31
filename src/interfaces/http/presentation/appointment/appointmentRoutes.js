const authMiddleware = require('../../middlewares/authMiddleware');
const appointmentSchema = require('./appointmentSchemas')();

module.exports = [
  {
    method: 'post',
    path: '/appointments',
    handler: 'appointmentController.create',
    middlewares: [authMiddleware],
    validation: { body: appointmentSchema.create },
    swagger: {
      tags: ['Appointments'],
      summary: 'Create a new appointment',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['patientName', 'patientPhone', 'type', 'date', 'time', 'estimatedValue'],
              properties: {
                patientName: { type: 'string', example: 'Maria Souza' },
                patientPhone: { type: 'string', example: '11999999999' },
                type: { type: 'string', enum: ['presencial', 'online'] },
                date: { type: 'string', example: '2025-08-15' },
                time: { type: 'string', example: '09:00' },
                estimatedValue: { type: 'number', example: 350 },
                notes: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Appointment created' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  {
    method: 'get',
    path: '/appointments',
    handler: 'appointmentController.list',
    middlewares: [authMiddleware],
    validation: { query: appointmentSchema.list },
    swagger: {
      tags: ['Appointments'],
      summary: 'List appointments',
      security: [{ BearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'date', schema: { type: 'string' }, description: 'Filter by date (YYYY-MM-DD)' },
        { in: 'query', name: 'status', schema: { type: 'string' }, description: 'Filter by status' },
      ],
      responses: {
        200: { description: 'List of appointments' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  {
    method: 'get',
    path: '/appointments/:id',
    handler: 'appointmentController.getById',
    middlewares: [authMiddleware],
    validation: { params: appointmentSchema.getById },
    swagger: {
      tags: ['Appointments'],
      summary: 'Get appointment by ID',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Appointment data' },
        404: { description: 'Not found' },
      },
    },
  },
  {
    method: 'patch',
    path: '/appointments/:id',
    handler: 'appointmentController.update',
    middlewares: [authMiddleware],
    validation: { params: appointmentSchema.getById, body: appointmentSchema.update },
    swagger: {
      tags: ['Appointments'],
      summary: 'Update appointment fields',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Appointment updated' } },
    },
  },
  {
    method: 'patch',
    path: '/appointments/:id/cancel',
    handler: 'appointmentController.cancel',
    middlewares: [authMiddleware],
    validation: { params: appointmentSchema.getById },
    swagger: {
      tags: ['Appointments'],
      summary: 'Cancel an appointment',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Appointment cancelled' } },
    },
  },
  {
    method: 'patch',
    path: '/appointments/:id/confirm',
    handler: 'appointmentController.confirm',
    middlewares: [authMiddleware],
    validation: { params: appointmentSchema.getById },
    swagger: {
      tags: ['Appointments'],
      summary: 'Confirm an appointment',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Appointment confirmed' } },
    },
  },
  {
    method: 'patch',
    path: '/appointments/:id/realize',
    handler: 'appointmentController.realize',
    middlewares: [authMiddleware],
    validation: { params: appointmentSchema.getById, body: appointmentSchema.realize },
    swagger: {
      tags: ['Appointments'],
      summary: 'Mark appointment as realized (with payment)',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['paidValue', 'paymentMethod', 'paymentDate'],
              properties: {
                paidValue: { type: 'number', example: 350 },
                paymentMethod: { type: 'string', enum: ['pix', 'cartao', 'dinheiro', 'convenio'] },
                paymentDate: { type: 'string', example: '2025-08-15' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Appointment realized' } },
    },
  },
  {
    method: 'get',
    path: '/appointments/:id/links',
    handler: 'appointmentController.generateLinks',
    middlewares: [authMiddleware],
    validation: { params: appointmentSchema.getById },
    swagger: {
      tags: ['Appointments'],
      summary: 'Generate WhatsApp reminder links (confirm, reschedule, review)',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Links for patient actions' },
      },
    },
  },
  {
    method: 'post',
    path: '/appointments/:id/return',
    handler: 'appointmentController.returnLink',
    middlewares: [authMiddleware],
    validation: { params: appointmentSchema.getById, body: appointmentSchema.returnLink },
    swagger: {
      tags: ['Appointments'],
      summary: 'Generate return appointment link for patient',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { daysAhead: { type: 'integer', example: 15 } },
            },
          },
        },
      },
      responses: { 200: { description: 'Return link generated' } },
    },
  },
];
