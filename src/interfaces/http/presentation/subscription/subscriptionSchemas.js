const Joi = require('joi');

module.exports = () => ({
  checkout: Joi.object({
    plan:         Joi.string().valid('essencial', 'profissional').required(),
    billingCycle: Joi.string().valid('monthly', 'annual').required(),
  }),
});
