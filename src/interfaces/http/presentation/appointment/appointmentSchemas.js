const Joi = require('joi');
const phoneSchema = require('../shared/phoneSchema');

module.exports = () => ({
  create: Joi.object({
    patientId: Joi.string().optional(),
    patientName: Joi.string().required(),
    patientPhone: phoneSchema({ required: false, allowEmpty: true }),
    // true quando o médico escolheu explicitamente "criar cliente separado"
    // no popup de divergência (editou nome/telefone de um cliente já
    // selecionado) — pula a busca por nome e sempre cria um cadastro novo.
    forceNewPatient: Joi.boolean().optional(),
    type: Joi.string().valid('presencial', 'online').required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    estimatedValue: Joi.number().min(0).required(),
    notes: Joi.string().optional().allow(''),
    location: Joi.string().optional().allow(''),
    customMeetingLink: Joi.string().uri().optional().allow(''),
    returnDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    returnTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
    returnEstimatedValue: Joi.number().min(0).optional(),
    returnIsPaid: Joi.boolean().optional(),
  }),

  update: Joi.object({
    patientName: Joi.string().optional(),
    type: Joi.string().valid('presencial', 'online').optional(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    time: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
    estimatedValue: Joi.number().min(0).optional(),
    notes: Joi.string().optional().allow(''),
  }),

  realize: Joi.object({
    paidValue: Joi.number().min(0).required(),
    // Id de uma das formas de pagamento configuradas pelo médico (lista
    // dinâmica, editável em Settings) — não é mais um enum fixo.
    paymentMethod: Joi.string().min(1).required(),
    paymentDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  }),

  getById: Joi.object({
    id: Joi.string().required(),
  }),

  list: Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: Joi.string().valid('agendado', 'confirmado', 'realizado', 'cancelado', 'aguardando_confirmacao').optional(),
    from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),

  returnLink: Joi.object({
    daysAhead: Joi.number().integer().min(1).optional(),
  }),

  createSeries: Joi.object({
    patientId: Joi.string().optional(),
    patientName: Joi.string().required(),
    patientPhone: phoneSchema({ required: false, allowEmpty: true }),
    forceNewPatient: Joi.boolean().optional(),
    type: Joi.string().valid('presencial', 'online').required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    estimatedValue: Joi.number().min(0).required(),
    notes: Joi.string().optional().allow(''),
    location: Joi.string().optional().allow(''),
    recurrence: Joi.object({
      frequency: Joi.string().valid('weekly', 'biweekly', 'monthly').required(),
    }).required(),
  }),

  seriesId: Joi.object({
    seriesId: Joi.string().required(),
  }),

  seriesFrom: Joi.object({
    from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  }),

  updateSeries: Joi.object({
    time: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
    estimatedValue: Joi.number().min(0).optional(),
    notes: Joi.string().optional().allow(''),
    location: Joi.string().optional().allow(''),
  }).min(1),
});
