const authMiddleware = require('../../middlewares/authMiddleware');
const locationSchema = require('./locationSchemas')();

module.exports = [
  {
    method: 'post',
    path: '/locations',
    handler: 'locationController.create',
    middlewares: [authMiddleware],
    validation: { body: locationSchema.create },
    swagger: {
      tags: ['Locations'],
      summary: 'Create a new location (used by presencial appointments and plantão shifts)',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', example: 'Hospital Municipal' },
                address: { type: 'string', example: 'Rua Augusta, 1200' },
                color: { type: 'string', description: 'Id da paleta curada, só relevante pra plantão', example: 'blue' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Location created' },
        409: { description: 'Name already registered' },
      },
    },
  },
  {
    method: 'get',
    path: '/locations',
    handler: 'locationController.list',
    middlewares: [authMiddleware],
    validation: { query: locationSchema.list },
    swagger: {
      tags: ['Locations'],
      summary: 'List locations (optionally filter by name)',
      security: [{ BearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Filter by name' },
      ],
      responses: { 200: { description: 'List of locations' } },
    },
  },
  {
    method: 'patch',
    path: '/locations/:location_id',
    handler: 'locationController.update',
    middlewares: [authMiddleware],
    validation: { params: locationSchema.getById, body: locationSchema.update },
    swagger: {
      tags: ['Locations'],
      summary: 'Update location',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'location_id', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Location updated' }, 404: { description: 'Not found' } },
    },
  },
  {
    method: 'delete',
    path: '/locations/:location_id',
    handler: 'locationController.delete',
    middlewares: [authMiddleware],
    validation: { params: locationSchema.getById },
    swagger: {
      tags: ['Locations'],
      summary: 'Delete location',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'location_id', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Location deleted' }, 404: { description: 'Not found' } },
    },
  },
];
