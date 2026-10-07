const Joi = require('joi');

const timeSchema = Joi.string()
  .pattern(/^([0-1]\d|2[0-3]):[0-5]\d$/)
  .messages({ 'string.pattern.base': 'Horário deve estar no formato HH:MM com valores válidos (00:00–23:59)' });

module.exports = () => ({
  create: Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    allDay: Joi.boolean().required(),
    startTime: Joi.when('allDay', { is: false, then: timeSchema.required(), otherwise: Joi.forbidden() }),
    endTime: Joi.when('allDay', { is: false, then: timeSchema.required(), otherwise: Joi.forbidden() }),
    reason: Joi.string().max(120).optional().allow(''),
  }),

  getById: Joi.object({
    blocked_id: Joi.string().required(),
  }),
});
