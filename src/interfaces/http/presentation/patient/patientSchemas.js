const Joi = require('joi');
const phoneSchema = require('../shared/phoneSchema');

module.exports = () => ({
  create: Joi.object({
    name: Joi.string().required(),
    phone: phoneSchema({ required: true }),
  }),

  update: Joi.object({
    name: Joi.string().optional(),
    phone: phoneSchema({ required: false }),
  }),

  getById: Joi.object({
    patient_id: Joi.string().required(),
  }),

  list: Joi.object({
    search: Joi.string().optional().allow(''),
  }),
});
