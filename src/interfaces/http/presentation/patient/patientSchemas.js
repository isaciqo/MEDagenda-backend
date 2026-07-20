const Joi = require('joi');

// C04: normaliza e valida telefone para compatibilidade com wa.me/{phone}
const phoneSchema = (required = true) => {
  const base = Joi.string().custom((value, helpers) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      return helpers.error('phone.invalid');
    }
    return digits;
  }).messages({
    'string.base': 'Telefone deve ser uma string',
    'phone.invalid': 'Telefone inválido. Use somente dígitos, entre 8 e 15 caracteres (ex: 5511999999999).',
  });
  return required ? base.required() : base.optional();
};

module.exports = () => ({
  create: Joi.object({
    name: Joi.string().required(),
    phone: phoneSchema(true),
  }),

  update: Joi.object({
    name: Joi.string().optional(),
    phone: phoneSchema(false),
  }),

  getById: Joi.object({
    patient_id: Joi.string().required(),
  }),

  list: Joi.object({
    search: Joi.string().optional().allow(''),
  }),
});
