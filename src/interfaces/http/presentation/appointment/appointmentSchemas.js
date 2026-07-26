const Joi = require('joi');

module.exports = () => ({
  create: Joi.object({
    patientId: Joi.string().optional(),
    patientName: Joi.string().required(),
    patientPhone: Joi.string().optional().allow(''),
    type: Joi.string().valid('presencial', 'online').required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    estimatedValue: Joi.number().min(0).required(),
    notes: Joi.string().optional().allow(''),
    location: Joi.string().optional().allow(''),
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
    paymentMethod: Joi.string().valid('pix', 'cartao', 'dinheiro', 'convenio').required(),
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
    patientPhone: Joi.string().optional().allow(''),
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
