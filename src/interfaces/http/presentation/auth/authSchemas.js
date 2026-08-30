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
    termsAccepted: Joi.boolean().valid(true).required().messages({
      'any.only': 'É necessário aceitar a Política de Privacidade para criar uma conta.',
      'any.required': 'É necessário aceitar a Política de Privacidade para criar uma conta.',
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  googleAuth: Joi.object({
    credential: Joi.string().required(),
    // Só é exigido de fato quando a conta ainda não existe. Aqui é só o
    // formato: se vier, tem que ser boolean. Ver GoogleAuthOperation.
    termsAccepted: Joi.boolean().optional(),
    referralCode: Joi.string().length(8).uppercase().optional(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: passwordSchema,
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().required(),
  }),
});
