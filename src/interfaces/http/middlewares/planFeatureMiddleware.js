const logger = require('../../../lib/logger');

const planFeatureMiddleware = (feature) => async (req, res, next) => {
  try {
    const container = require('../container');
    const userRepository = container.resolve('userRepository');
    const planService    = container.resolve('planService');

    const user = await userRepository.findById(req.user.user_id);
    if (!user || !planService.hasFeature(user, feature)) {
      const effectivePlan = user ? planService.getEffectivePlan(user) : 'unknown';
      return res.status(402).json({
        message: effectivePlan === 'expired'
          ? 'Seu plano expirou. Escolha um plano para continuar.'
          : 'Este recurso não está disponível no seu plano atual. Faça upgrade para acessar.',
        code: 'PLAN_REQUIRED',
        effectivePlan,
      });
    }
    next();
  } catch (err) {
    logger.error('planFeatureMiddleware: erro', { message: err.message });
    next(err);
  }
};

module.exports = planFeatureMiddleware;
