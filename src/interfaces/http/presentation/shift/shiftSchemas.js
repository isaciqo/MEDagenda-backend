const Joi = require('joi');

const dateSchema = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = Joi.string().pattern(/^\d{2}:\d{2}$/);

// endDate/endTime podem estar em qualquer dia depois de date/time (plantão de
// fim de semana inteiro é um caso real) — só valida que não é antes do início,
// e um teto de sanidade de 30 dias contra erro de digitação, não uso real.
function validateDuration(value, helpers) {
  const { date, time, endDate, endTime } = value;
  const start = new Date(date + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const diffDays = Math.round((end - start) / (24 * 60 * 60 * 1000));
  if (diffDays < 0 || (diffDays === 0 && endTime <= time)) {
    return helpers.error('shift.endBeforeStart');
  }
  if (diffDays > 30) {
    return helpers.error('shift.tooLong');
  }
  return value;
}

const durationMessages = {
  'shift.endBeforeStart': 'A data/hora de fim deve ser depois do início.',
  'shift.tooLong': 'O plantão não pode durar mais de 30 dias — confira as datas.',
};

module.exports = () => ({
  create: Joi.object({
    locationId: Joi.string().required(),
    date: dateSchema.required(),
    time: timeSchema.required(),
    endDate: dateSchema.required(),
    endTime: timeSchema.required(),
    estimatedValue: Joi.number().min(0).required(),
    notes: Joi.string().optional().allow(''),
  }).custom(validateDuration).messages(durationMessages),

  update: Joi.object({
    locationId: Joi.string().optional(),
    date: dateSchema.optional(),
    time: timeSchema.optional(),
    endDate: dateSchema.optional(),
    endTime: timeSchema.optional(),
    estimatedValue: Joi.number().min(0).optional(),
    notes: Joi.string().optional().allow(''),
  })
    .and('date', 'time', 'endDate', 'endTime')
    .custom((value, helpers) => (value.date ? validateDuration(value, helpers) : value))
    .messages({
      ...durationMessages,
      'object.and': 'Pra mudar data ou hora, envie início e fim juntos (date, time, endDate, endTime).',
    }),

  realize: Joi.object({
    paidValue: Joi.number().min(0).required(),
    paymentMethod: Joi.string().min(1).required(),
    paymentDate: dateSchema.required(),
  }),

  getById: Joi.object({
    id: Joi.string().required(),
  }),

  list: Joi.object({
    date: dateSchema.optional(),
    status: Joi.string().valid('agendado', 'realizado', 'cancelado').optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  }),

  createSeries: Joi.object({
    locationId: Joi.string().required(),
    date: dateSchema.required(),
    time: timeSchema.required(),
    endDate: dateSchema.required(),
    endTime: timeSchema.required(),
    estimatedValue: Joi.number().min(0).required(),
    notes: Joi.string().optional().allow(''),
    recurrence: Joi.object({
      type: Joi.string().valid('weekly', 'biweekly', 'monthly', 'fixedDaysOfMonth', 'everyNDays').required(),
      days: Joi.when('type', {
        is: 'fixedDaysOfMonth',
        then: Joi.array().items(Joi.number().integer().min(1).max(31)).min(1).max(10).required(),
        otherwise: Joi.forbidden(),
      }),
      n: Joi.when('type', {
        is: 'everyNDays',
        then: Joi.number().integer().min(1).max(60).required(),
        otherwise: Joi.forbidden(),
      }),
    }).required(),
  }).custom(validateDuration).messages(durationMessages),

  seriesId: Joi.object({
    seriesId: Joi.string().required(),
  }),

  seriesFrom: Joi.object({
    from: dateSchema.required(),
  }),

  updateSeries: Joi.object({
    estimatedValue: Joi.number().min(0).optional(),
    notes: Joi.string().optional().allow(''),
  }).min(1),
});
