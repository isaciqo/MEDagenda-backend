const MONTHLY_LIMIT = {
  trial: 80,
  essencial: 80,
  profissional: Infinity,
};

// Features disponíveis por plano (Essencial tem apenas as básicas)
const PLAN_FEATURES = {
  trial:        ['whatsapp', 'avaliacoes', 'dashboard_metrics', 'financeiro_completo'],
  essencial:    [],
  profissional: ['whatsapp', 'avaliacoes', 'dashboard_metrics', 'financeiro_completo'],
};

class PlanService {
  // Retorna o plano "efetivo": considera expiração
  getEffectivePlan(user) {
    const { plan, trialExpiresAt, planExpiresAt } = user;
    const now = Date.now();

    if (plan === 'trial') {
      if (trialExpiresAt && now > new Date(trialExpiresAt).getTime()) return 'expired';
      return 'trial';
    }
    if (plan === 'essencial' || plan === 'profissional') {
      if (planExpiresAt && now > new Date(planExpiresAt).getTime()) return 'expired';
      return plan;
    }
    return 'expired';
  }

  // Verifica se pode criar `newCount` consultas (1 ou 2 com retorno)
  canCreateAppointment(user, currentMonthCount, newCount = 1) {
    const effective = this.getEffectivePlan(user);

    if (effective === 'expired') {
      const err = new Error(
        user.plan === 'trial'
          ? 'Seu período gratuito de 30 dias expirou. Escolha um plano para continuar agendando.'
          : 'Sua assinatura expirou. Renove seu plano para continuar agendando.'
      );
      err.statusCode = 402;
      err.code = 'TRIAL_EXPIRED';
      throw err;
    }

    const limit = MONTHLY_LIMIT[effective] ?? 0;
    if (limit !== Infinity && currentMonthCount + newCount > limit) {
      const err = new Error(
        `Limite de ${limit} consultas por mês atingido no seu plano. ` +
        (effective === 'essencial'
          ? 'Faça upgrade para o plano Profissional para consultas ilimitadas.'
          : 'Faça upgrade para continuar agendando.')
      );
      err.statusCode = 402;
      err.code = 'PLAN_LIMIT_REACHED';
      err.limit = limit;
      err.current = currentMonthCount;
      throw err;
    }
  }

  hasFeature(user, feature) {
    const effective = this.getEffectivePlan(user);
    if (effective === 'expired') return false;
    return (PLAN_FEATURES[effective] ?? []).includes(feature);
  }

  // Monta o objeto de info de plano retornado no /me
  buildPlanInfo(user, monthlyAppointmentCount) {
    const effectivePlan = this.getEffectivePlan(user);
    const limit = effectivePlan !== 'expired' ? (MONTHLY_LIMIT[effectivePlan] ?? 0) : 0;

    return {
      plan: user.plan,
      effectivePlan,
      trialExpiresAt: user.trialExpiresAt ?? null,
      planExpiresAt: user.planExpiresAt ?? null,
      monthlyAppointmentCount,
      monthlyAppointmentLimit: limit === Infinity ? null : limit,
      features: effectivePlan !== 'expired' ? (PLAN_FEATURES[effectivePlan] ?? []) : [],
    };
  }
}

module.exports = PlanService;
