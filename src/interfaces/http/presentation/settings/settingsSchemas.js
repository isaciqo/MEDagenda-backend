const Joi = require('joi');

const makeTemplateSchema = (allowedVars, displayVars, requiredVar) => Joi.string().custom((value, helpers) => {
  const matches = [...value.matchAll(/\{([^}]+)\}/g)];
  const used = matches.map(m => m[1].trim());
  const invalid = used.filter(v => !allowedVars.has(v));

  if (invalid.length > 0) {
    const invalidDisplay = invalid.map(v => `{${v}}`).join(', ');
    return helpers.error('template.invalidVar', { invalidDisplay });
  }

  if (requiredVar && !used.includes(requiredVar)) {
    return helpers.error('template.missingRequired');
  }

  return value;
}).optional().messages({
  'template.invalidVar': `Variável(is) inválida(s) no template: {{#invalidDisplay}}. Use apenas: ${displayVars}.`,
  'template.missingRequired': `O template precisa incluir a variável "${requiredVar}".`,
});

// 'nome' aceito como alias legado de 'cliente', 'medico' como alias legado de 'profissional' —
// templates salvos antes das renomeações continuam válidos.
const whatsappTemplateSchema = makeTemplateSchema(
  new Set(['cliente', 'nome', 'data', 'hora', 'profissional', 'medico', 'link', 'endereco', 'link_reuniao']),
  'cliente, data, hora, profissional, link, endereco, link_reuniao',
  'link'
);

const reviewTemplateSchema = makeTemplateSchema(
  new Set(['cliente', 'link']),
  'cliente, link',
  'link'
);

const returnTemplateSchema = makeTemplateSchema(
  new Set(['cliente', 'profissional', 'medico', 'dias']),
  'cliente, profissional, dias'
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
