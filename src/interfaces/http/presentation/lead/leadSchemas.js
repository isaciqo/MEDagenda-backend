const Joi = require('joi');

module.exports = () => ({
  clinicLead: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    email: Joi.string().trim().email().max(200).required(),
    clinicName: Joi.string().trim().max(120).allow('').optional(),
    professionalsCount: Joi.string().trim().max(30).allow('').optional(),
    message: Joi.string().trim().min(5).max(2000).required(),
  }),
});
