const authMiddleware = require('../../middlewares/authMiddleware');
const authSchema = require('./authSchemas')();

module.exports = [
  {
    method: 'post',
    path: '/auth/register',
    handler: 'authController.register',
    middlewares: [],
    validation: { body: authSchema.register },
    swagger: {
      tags: ['Auth'],
      summary: 'Register a new doctor account',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'dr.joao@example.com' },
                password: { type: 'string', minLength: 6, example: 'senha123' },
                name: { type: 'string', example: 'Dr. João Silva' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Returns accessToken and refreshToken' },
        400: { description: 'Validation error or email already in use' },
      },
    },
  },
  {
    method: 'post',
    path: '/auth/login',
    handler: 'authController.login',
    middlewares: [],
    validation: { body: authSchema.login },
    swagger: {
      tags: ['Auth'],
      summary: 'Login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Returns accessToken and refreshToken' },
        401: { description: 'Invalid credentials' },
      },
    },
  },
  {
    method: 'get',
    path: '/auth/me',
    handler: 'authController.me',
    middlewares: [authMiddleware],
    validation: {},
    swagger: {
      tags: ['Auth'],
      summary: 'Get current authenticated doctor profile',
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: 'Doctor profile' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  {
    method: 'post',
    path: '/auth/forgot-password',
    handler: 'authController.forgotPassword',
    middlewares: [],
    validation: { body: authSchema.forgotPassword },
    swagger: {
      tags: ['Auth'],
      summary: 'Request password reset email',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string', format: 'email' } },
            },
          },
        },
      },
      responses: { 204: { description: 'Reset email sent if account exists' } },
    },
  },
  {
    method: 'post',
    path: '/auth/logout',
    handler: 'authController.logout',
    middlewares: [authMiddleware],
    validation: {},
    swagger: {
      tags: ['Auth'],
      summary: 'Logout',
      security: [{ BearerAuth: [] }],
      responses: { 204: { description: 'Logged out' } },
    },
  },
];
