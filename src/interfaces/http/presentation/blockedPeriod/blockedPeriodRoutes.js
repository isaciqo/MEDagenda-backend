const authMiddleware = require('../../middlewares/authMiddleware');
const blockedPeriodSchema = require('./blockedPeriodSchemas')();

module.exports = [
  {
    method: 'get',
    path: '/blocked-periods',
    handler: 'blockedPeriodController.list',
    middlewares: [authMiddleware],
    validation: {},
    swagger: {
      tags: ['BlockedPeriods'],
      summary: 'List upcoming blocked periods (one-off agenda blocks, not the weekly schedule)',
      security: [{ BearerAuth: [] }],
      responses: { 200: { description: 'List of blocked periods' } },
    },
  },
  {
    method: 'post',
    path: '/blocked-periods',
    handler: 'blockedPeriodController.create',
    middlewares: [authMiddleware],
    validation: { body: blockedPeriodSchema.create },
    swagger: {
      tags: ['BlockedPeriods'],
      summary: 'Create a one-off blocked period (full day or a time range on a specific date)',
      security: [{ BearerAuth: [] }],
      responses: { 201: { description: 'Blocked period created' } },
    },
  },
  {
    method: 'delete',
    path: '/blocked-periods/:blocked_id',
    handler: 'blockedPeriodController.delete',
    middlewares: [authMiddleware],
    validation: { params: blockedPeriodSchema.getById },
    swagger: {
      tags: ['BlockedPeriods'],
      summary: 'Delete a blocked period',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'blocked_id', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Blocked period deleted' }, 404: { description: 'Not found' } },
    },
  },
];
