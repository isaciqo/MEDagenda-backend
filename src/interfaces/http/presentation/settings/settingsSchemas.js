const Joi = require('joi');

const daySchema = Joi.object({
  start: Joi.string().pattern(/^\d{2}:\d{2}$/),
  end: Joi.string().pattern(/^\d{2}:\d{2}$/),
  enabled: Joi.boolean(),
});

module.exports = () => ({
  update: Joi.object({
    name: Joi.string().optional(),
    specialty: Joi.string().optional().allow(''),
    photoUrl: Joi.string().uri().optional().allow('', null),
    whatsappTemplate: Joi.string().optional(),
    defaultDuration: Joi.number().integer().min(5).max(240).optional(),
    schedule: Joi.object({
      segunda: daySchema,
      terca: daySchema,
      quarta: daySchema,
      quinta: daySchema,
      sexta: daySchema,
      sabado: daySchema,
      domingo: daySchema,
    }).optional(),
  }),
});
