const Joi = require('joi');
const phoneSchema = require('../shared/phoneSchema');

module.exports = () => ({
  create: Joi.object({
    name: Joi.string().required(),
    phone: phoneSchema({ required: false, allowEmpty: true }),
    birthDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow(null, ''),
    guardianName: Joi.string().trim().min(2).max(120).optional().allow(null, ''),
    guardianRelationship: Joi.string().trim().min(2).max(60).optional().allow(null, ''),
  }),

  update: Joi.object({
    name: Joi.string().optional(),
    phone: phoneSchema({ required: false }),
    birthDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow(null, ''),
    guardianName: Joi.string().trim().min(2).max(120).optional().allow(null, ''),
    guardianRelationship: Joi.string().trim().min(2).max(60).optional().allow(null, ''),
  }),

  getById: Joi.object({
    patient_id: Joi.string().required(),
  }),

  list: Joi.object({
    search: Joi.string().optional().allow(''),
  }),
});
