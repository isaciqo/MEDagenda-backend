const Joi = require('joi');

module.exports = () => ({
  create: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
  }).min(1),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(100).required(),
  }),

  confirmEmail: Joi.object({
    token: Joi.string().required(),
  }),

  requestPasswordReset: Joi.object({
    email: Joi.string().email().required(),
  }),

  confirmPasswordReset: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).max(100).required(),
  }),

  getUserById: Joi.object({
    user_id: Joi.string().required(),
  }),
});
