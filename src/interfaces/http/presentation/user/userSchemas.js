const Joi = require('joi');

const passwordSchema = Joi.string()
  .min(8)
  .max(100)
  .pattern(/^(?=.*\d)(?=.*[^a-zA-Z0-9])/)
  .required()
  .messages({
    'string.min': 'A senha deve ter no mínimo 8 caracteres.',
    'string.pattern.base': 'A senha deve conter pelo menos um número e um caractere especial.',
  });

module.exports = () => ({
  create: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: passwordSchema,
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    onboardingCompleted: Joi.boolean(),
    followUpMode: Joi.string().valid('paid_recurrence', 'return', 'free').allow(null),
  }).min(1),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: passwordSchema,
  }),

  confirmEmail: Joi.object({
    token: Joi.string().required(),
  }),

  requestPasswordReset: Joi.object({
    email: Joi.string().email().required(),
  }),

  confirmPasswordReset: Joi.object({
    token: Joi.string().required(),
    newPassword: passwordSchema,
  }),

  getUserById: Joi.object({
    user_id: Joi.string().required(),
  }),
});
