const Joi = require('joi');

const makeTemplateSchema = (allowedVars, displayVars) => Joi.string().custom((value, helpers) => {
  const matches = [...value.matchAll(/\{([^}]+)\}/g)];
  const invalid = matches
    .map(m => m[1].trim())
    .filter(v => !allowedVars.has(v));

  if (invalid.length > 0) {
    const invalidDisplay = invalid.map(v => `{${v}}`).join(', ');
    return helpers.error('template.invalidVar', { invalidDisplay });
  }
  return value;
}).optional().messages({
  'template.invalidVar': `Variável(is) inválida(s) no template: {{#invalidDisplay}}. Use apenas: ${displayVars}.`,
});

// 'nome' aceito como alias legado de 'cliente' — templates salvos antes da renomeação continuam válidos.
const whatsappTemplateSchema = makeTemplateSchema(
  new Set(['cliente', 'nome', 'data', 'hora', 'medico', 'link', 'endereco']),
  'cliente, data, hora, medico, link, endereco'
);

const reviewTemplateSchema = makeTemplateSchema(
  new Set(['cliente', 'link']),
  'cliente, link'
);

const returnTemplateSchema = makeTemplateSchema(
  new Set(['cliente', 'medico', 'dias']),
  'cliente, medico, dias'
);

// CF03: valida horas semanticamente (00–23) e minutos (00–59), e garante start < end
const timeSchema = Joi.string()
  .pattern(/^([0-1]\d|2[0-3]):[0-5]\d$/)
  .messages({ 'string.pattern.base': 'Horário deve estar no formato HH:MM com valores válidos (00:00–23:59)' });

const daySchema = Joi.object({
  start: timeSchema.optional(),
  end: timeSchema.optional(),
  enabled: Joi.boolean().optional(),
}).custom((value, helpers) => {
  if (value.start && value.end && value.start >= value.end) {
    return helpers.error('day.range');
  }
  return value;
}).messages({
  'day.range': 'O horário de início deve ser anterior ao horário de término',
});

module.exports = () => ({
  update: Joi.object({
    name: Joi.string().optional(),
    specialty: Joi.string().optional().allow(''),
    clinicAddress: Joi.string().optional().allow(''),
    photoUrl: Joi.string().uri().optional().allow('', null),
    whatsappTemplate: whatsappTemplateSchema,
    reviewTemplate: reviewTemplateSchema,
    returnTemplate: returnTemplateSchema,
    defaultDuration: Joi.number().integer().min(5).max(240).optional(),
    defaultConsultationValue: Joi.number().min(0).optional(),
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
