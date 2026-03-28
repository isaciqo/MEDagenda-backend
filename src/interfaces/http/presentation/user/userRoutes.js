const authMiddleware = require('../../middlewares/authMiddleware');
const userSchema = require('./userSchemas')();

module.exports = [
  {
    method: 'post',
    path: '/users',
    handler: 'userController.createUser',
    middlewares: [],
    validation: { body: userSchema.create },
    swagger: {
      tags: ['Users'],
      summary: 'Register a new user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'password'],
              properties: {
                name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                password: { type: 'string', minLength: 6, example: 'secret123' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'User created. Confirmation email sent.' },
        400: { description: 'Validation error or email already in use' },
      },
    },
  },
  {
    method: 'post',
    path: '/users/login',
    handler: 'userController.login',
    middlewares: [],
    validation: { body: userSchema.login },
    swagger: {
      tags: ['Users'],
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
        200: { description: 'Returns JWT token and user info' },
        401: { description: 'Invalid credentials' },
      },
    },
  },
  {
    method: 'get',
    path: '/users/confirm/:token',
    handler: 'userController.confirmEmail',
    middlewares: [],
    validation: { params: userSchema.confirmEmail },
    swagger: {
      tags: ['Users'],
      summary: 'Confirm email address',
      parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Email confirmed' },
        400: { description: 'Invalid token' },
      },
    },
  },
  {
    method: 'post',
    path: '/users/request-password-reset',
    handler: 'userController.requestPasswordReset',
    middlewares: [],
    validation: { body: userSchema.requestPasswordReset },
    swagger: {
      tags: ['Users'],
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
      responses: { 200: { description: 'Reset email sent if account exists' } },
    },
  },
  {
    method: 'post',
    path: '/users/reset-password',
    handler: 'userController.confirmPasswordReset',
    middlewares: [],
    validation: { body: userSchema.confirmPasswordReset },
    swagger: {
      tags: ['Users'],
      summary: 'Confirm password reset with token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'newPassword'],
              properties: {
                token: { type: 'string' },
                newPassword: { type: 'string', minLength: 6 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Password reset successfully' },
        400: { description: 'Invalid or expired token' },
      },
    },
  },
  {
    method: 'get',
    path: '/users/:user_id',
    handler: 'userController.getUser',
    middlewares: [authMiddleware],
    validation: { params: userSchema.getUserById },
    swagger: {
      tags: ['Users'],
      summary: 'Get user by ID',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'user_id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'User data' },
        401: { description: 'Unauthorized' },
        404: { description: 'User not found' },
      },
    },
  },
  {
    method: 'patch',
    path: '/users/:user_id',
    handler: 'userController.updateUser',
    middlewares: [authMiddleware],
    validation: { params: userSchema.getUserById, body: userSchema.updateUser },
    swagger: {
      tags: ['Users'],
      summary: 'Update user',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'user_id', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'User updated' },
        401: { description: 'Unauthorized' },
        404: { description: 'User not found' },
      },
    },
  },
  {
    method: 'patch',
    path: '/users/:user_id/change-password',
    handler: 'userController.changePassword',
    middlewares: [authMiddleware],
    validation: { params: userSchema.getUserById, body: userSchema.changePassword },
    swagger: {
      tags: ['Users'],
      summary: 'Change user password',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'user_id', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: { type: 'string' },
                newPassword: { type: 'string', minLength: 6 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Password changed' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  {
    method: 'delete',
    path: '/users/:user_id',
    handler: 'userController.deleteUser',
    middlewares: [authMiddleware],
    validation: { params: userSchema.getUserById },
    swagger: {
      tags: ['Users'],
      summary: 'Delete user',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'user_id', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'User deleted' },
        401: { description: 'Unauthorized' },
        404: { description: 'User not found' },
      },
    },
  },
];
