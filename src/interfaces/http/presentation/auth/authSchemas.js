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
  register: Joi.object({
    email: Joi.string().email().required(),
    password: passwordSchema,
    name: Joi.string().optional(),
    referralCode: Joi.string().length(8).uppercase().optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: passwordSchema,
  }),
});
