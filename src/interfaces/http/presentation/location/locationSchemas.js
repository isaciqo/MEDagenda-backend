const Joi = require('joi');
const { PLANTAO_COLOR_IDS } = require('../../../../lib/plantaoColors');

module.exports = () => ({
  create: Joi.object({
    name: Joi.string().min(1).required(),
    address: Joi.string().optional().allow(''),
    color: Joi.string().valid(...PLANTAO_COLOR_IDS).optional().allow(null),
    defaultShiftDurationMinutes: Joi.number().integer().min(1).max(30 * 24 * 60).optional().allow(null),
  }),

  update: Joi.object({
    name: Joi.string().min(1).optional(),
    address: Joi.string().optional().allow(''),
    color: Joi.string().valid(...PLANTAO_COLOR_IDS).optional().allow(null),
    defaultShiftDurationMinutes: Joi.number().integer().min(1).max(30 * 24 * 60).optional().allow(null),
  }),

  getById: Joi.object({
    location_id: Joi.string().required(),
  }),

  list: Joi.object({
    search: Joi.string().optional().allow(''),
  }),
});
