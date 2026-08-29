const Joi = require('joi');

// C04: normaliza e valida telefone (número "possível") para compatibilidade
// com wa.me/{phone} — dígitos entre 8 e 15, sem exigir DDI/DDD específico.
// `allowEmpty` existe pra rotas onde telefone é dispensável quando a consulta
// já está vinculada a um cliente cadastrado (ex: criar consulta via patientId).
function phoneSchema({ required = true, allowEmpty = false } = {}) {
  let base = Joi.string().custom((value, helpers) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      return helpers.error('phone.invalid');
    }
    return digits;
  }).messages({
    'string.base': 'Telefone deve ser uma string',
    'phone.invalid': 'Telefone inválido. Use somente dígitos, entre 8 e 15 caracteres (ex: 5511999999999).',
  });
  if (allowEmpty) base = base.allow('');
  return required ? base.required() : base.optional();
}

module.exports = phoneSchema;
