const authMiddleware = require('../../middlewares/authMiddleware');
const patientSchema = require('./patientSchemas')();

module.exports = [
  {
    method: 'post',
    path: '/patients',
    handler: 'patientController.create',
    middlewares: [authMiddleware],
    validation: { body: patientSchema.create },
    swagger: {
      tags: ['Patients'],
      summary: 'Create a new patient',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'phone'],
              properties: {
                name: { type: 'string', example: 'Maria Silva' },
                phone: { type: 'string', example: '5511999990000' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Patient created' },
        409: { description: 'Phone already registered' },
      },
    },
  },
  {
    method: 'get',
    path: '/patients',
    handler: 'patientController.list',
    middlewares: [authMiddleware],
    validation: { query: patientSchema.list },
    swagger: {
      tags: ['Patients'],
      summary: 'List patients (optionally filter by name)',
      security: [{ BearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Filter by name' },
      ],
      responses: { 200: { description: 'List of patients' } },
    },
  },
  {
    method: 'patch',
    path: '/patients/:patient_id',
    handler: 'patientController.update',
    middlewares: [authMiddleware],
    validation: { params: patientSchema.getById, body: patientSchema.update },
    swagger: {
      tags: ['Patients'],
      summary: 'Update patient',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'patient_id', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Patient updated' }, 404: { description: 'Not found' } },
    },
  },
  {
    method: 'delete',
    path: '/patients/:patient_id',
    handler: 'patientController.delete',
    middlewares: [authMiddleware],
    validation: { params: patientSchema.getById },
    swagger: {
      tags: ['Patients'],
      summary: 'Delete patient',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'patient_id', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Patient deleted' }, 404: { description: 'Not found' } },
    },
  },
];
