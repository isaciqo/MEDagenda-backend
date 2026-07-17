const Joi = require('joi');

module.exports = () => ({
  create: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
  }),

  update: Joi.object({
    name: Joi.string().optional(),
    phone: Joi.string().optional(),
  }),

  getById: Joi.object({
    patient_id: Joi.string().required(),
  }),

  list: Joi.object({
    search: Joi.string().optional().allow(''),
  }),
});
