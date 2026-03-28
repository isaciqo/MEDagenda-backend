const Joi = require('joi');

module.exports = () => ({
  create: Joi.object({
    appointmentId: Joi.string().uuid().required(),
    patientName: Joi.string().optional().allow('', null),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().required(),
  }),
});
