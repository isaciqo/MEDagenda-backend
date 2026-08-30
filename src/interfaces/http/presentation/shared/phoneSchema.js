const Joi = require('joi');

// C04: normaliza e valida telefone pra compatibilidade com wa.me/{phone}.
// Formato exigido: DDD (2 dígitos) + celular (9 dígitos, começando com 9),
// com ou sem parênteses no DDD. Ex: "(91)988681785" ou "91988681785", que
// normalizam pro mesmo valor salvo, sem parênteses/espaço/traço.
// DDD é obrigatório: sem ele, o número não funciona no link do WhatsApp.
const PHONE_REGEX = /^\d{2}9\d{8}$/;

// `allowEmpty` existe pra rotas onde telefone é dispensável quando a consulta
// já está vinculada a um cliente cadastrado (ex: criar consulta via patientId).
function phoneSchema({ required = true, allowEmpty = false } = {}) {
  let base = Joi.string().custom((value, helpers) => {
    const digits = value.replace(/\D/g, '');
    if (!PHONE_REGEX.test(digits)) {
      return helpers.error('phone.invalid');
    }
    return digits;
  }).messages({
    'string.base': 'Telefone deve ser uma string',
    'phone.invalid': 'Telefone inválido. Use o formato com DDD, ex: (91)988681785 ou 91988681785.',
  });
  if (allowEmpty) base = base.allow('');
  return required ? base.required() : base.optional();
}

module.exports = phoneSchema;
