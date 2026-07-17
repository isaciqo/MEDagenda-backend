const Joi = require('joi');

const ALLOWED_TEMPLATE_VARS = new Set(['nome', 'data', 'hora', 'medico', 'link', 'endereco']);
const ALLOWED_DISPLAY = 'nome, data, hora, medico, link, endereco';

const whatsappTemplateSchema = Joi.string().custom((value, helpers) => {
  const matches = [...value.matchAll(/\{([^}]+)\}/g)];
  const invalid = matches
    .map(m => m[1].trim())
    .filter(v => !ALLOWED_TEMPLATE_VARS.has(v));

  if (invalid.length > 0) {
    const invalidDisplay = invalid.map(v => `{${v}}`).join(', ');
    return helpers.error('whatsappTemplate.invalidVar', { invalidDisplay });
  }
  return value;
}).optional().messages({
  'whatsappTemplate.invalidVar': `Variável(is) inválida(s) no template: {{#invalidDisplay}}. Use apenas: ${ALLOWED_DISPLAY}.`,
});

const daySchema = Joi.object({
  start: Joi.string().pattern(/^\d{2}:\d{2}$/),
  end: Joi.string().pattern(/^\d{2}:\d{2}$/),
  enabled: Joi.boolean(),
});

module.exports = () => ({
  update: Joi.object({
    name: Joi.string().optional(),
    specialty: Joi.string().optional().allow(''),
    clinicAddress: Joi.string().optional().allow(''),
    photoUrl: Joi.string().uri().optional().allow('', null),
    whatsappTemplate: whatsappTemplateSchema,
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
