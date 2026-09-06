const Joi = require('joi');

// Só o link (quando existe) é obrigatório — qualquer outro texto é livre. Um
// "{algo}" não reconhecido simplesmente não é substituído na hora de montar a
// mensagem (fica literal), não é motivo pra bloquear o salvamento.
const makeTemplateSchema = (requiredVar) => Joi.string().custom((value, helpers) => {
  if (requiredVar && !value.includes(`{${requiredVar}}`)) {
    return helpers.error('template.missingRequired');
  }
  return value;
}).optional().messages({
  'template.missingRequired': `O template precisa incluir a variável "${requiredVar}".`,
});

const whatsappTemplateSchema = makeTemplateSchema('link');
const reviewTemplateSchema = makeTemplateSchema('link');
const returnTemplateSchema = makeTemplateSchema();
const meetingLinkTemplateSchema = makeTemplateSchema('link_reuniao');
const rescheduleAcceptedTemplateSchema = makeTemplateSchema();
const pixMessageTemplateSchema = makeTemplateSchema('chave');

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

// Lista dinâmica: o médico decide o id/rótulo, não é mais um enum fixo.
const paymentMethodItemSchema = Joi.object({
  id: Joi.string().min(1).required(),
  label: Joi.string().min(1).max(60).required(),
  percentage: Joi.number().min(0).max(100).optional(),
  fixed: Joi.number().min(0).optional(),
});

// Config de recebimento via Pix. Limites: 77 = campo 01 do template 26 no
// EMV/BR Code; 25 e 15 = campos 59 (nome) e 60 (cidade).
const pixConfigSchema = Joi.object({
  key: Joi.string().trim().max(77).allow('').optional(),
  keyType: Joi.string().valid('cpf', 'cnpj', 'email', 'phone', 'evp', '').optional(),
  receiverName: Joi.string().trim().max(25).allow('').optional(),
  receiverCity: Joi.string().trim().max(15).allow('').optional(),
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
    meetingLinkTemplate: meetingLinkTemplateSchema,
    rescheduleAcceptedTemplate: rescheduleAcceptedTemplateSchema,
    pixMessageTemplate: pixMessageTemplateSchema,
    defaultDuration: Joi.number().integer().min(5).max(240).optional(),
    defaultConsultationValue: Joi.number().min(0).optional(),
    allowPatientReschedule: Joi.boolean().optional(),
    schedule: Joi.object({
      segunda: daySchema,
      terca: daySchema,
      quarta: daySchema,
      quinta: daySchema,
      sexta: daySchema,
      sabado: daySchema,
      domingo: daySchema,
    }).optional(),
    paymentMethods: Joi.array().items(paymentMethodItemSchema).optional(),
    pix: pixConfigSchema.optional(),
  }),
});
