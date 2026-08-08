const rateLimit = require('express-rate-limit');
const authMiddleware = require('../../middlewares/authMiddleware');
const ownershipMiddleware = require('../../middlewares/ownershipMiddleware');
const userSchema = require('./userSchemas')();

// O cooldown de 24h dentro de RequestEmailChangeOperation só se aplica quando o
// MESMO newEmail é repetido — trocar o alvo a cada chamada não tinha freio nenhum,
// virando um bombardeiro de e-mail contra qualquer endereço externo (ver
// ANALISE_ABUSO_CUSTO.md, Business-Flow-03). Este limite é por CONTA atacante,
// independente do e-mail-alvo, e continua permitindo a correção instantânea de um
// e-mail digitado errado (poucas tentativas por hora é suficiente pra isso).
const emailChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas solicitações de troca de e-mail. Aguarde antes de tentar novamente.' },
});

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
    middlewares: [authMiddleware, ownershipMiddleware],
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
    middlewares: [authMiddleware, ownershipMiddleware],
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
    middlewares: [authMiddleware, ownershipMiddleware],
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
    method: 'post',
    path: '/users/:user_id/request-email-change',
    handler: 'userController.requestEmailChange',
    middlewares: [authMiddleware, ownershipMiddleware, emailChangeLimiter],
    validation: { params: userSchema.getUserById, body: userSchema.requestEmailChange },
    swagger: {
      tags: ['Users'],
      summary: 'Request an email change — sends a confirmation link to the new address',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'user_id', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newEmail'],
              properties: {
                currentPassword: { type: 'string' },
                newEmail: { type: 'string', format: 'email' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Confirmation email sent' },
        400: { description: 'Invalid password or Google-linked account' },
        409: { description: 'Email already in use' },
        429: { description: 'Resend cooldown active' },
      },
    },
  },
  {
    method: 'get',
    path: '/users/confirm-email-change/:token',
    handler: 'userController.confirmEmailChange',
    middlewares: [],
    validation: { params: userSchema.confirmEmailChange },
    swagger: {
      tags: ['Users'],
      summary: 'Confirm a pending email change',
      parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Email changed' },
        400: { description: 'Invalid or expired token' },
      },
    },
  },
  {
    method: 'delete',
    path: '/users/:user_id/pending-email-change',
    handler: 'userController.cancelEmailChange',
    middlewares: [authMiddleware, ownershipMiddleware],
    validation: { params: userSchema.getUserById },
    swagger: {
      tags: ['Users'],
      summary: 'Cancel a pending email change',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'user_id', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Pending email change cancelled' } },
    },
  },
  {
    method: 'delete',
    path: '/users/:user_id',
    handler: 'userController.deleteUser',
    middlewares: [authMiddleware, ownershipMiddleware],
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
