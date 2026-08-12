const User = require('../../database/models/user/userModel');
const logger = require('../../lib/logger');

const PLAN_LABEL = { essencial: 'Essencial', profissional: 'Profissional' };

class PlanExpiryWarningJob {
  constructor({ emailService }) {
    this.emailService = emailService;
  }

  async run() {
    logger.info('PlanExpiryWarningJob: iniciando verificação de planos pagos expirando');

    const base     = (process.env.FRONTEND_URL || 'http://localhost:8080').split(',')[0].trim();
    const renewUrl = `${base}/configuracoes`;

    let notified = 0;
    let errors   = 0;

    // Mesmo padrão do TrialWarningJob: processa um usuário de cada vez com
    // findOneAndUpdate atômico, pra múltiplas instâncias não notificarem em duplicidade.
    // stripeSubscriptionId: null é o que garante que só avisamos quem realmente vai
    // perder acesso — enquanto a assinatura tá ativa, a Stripe renova sozinha e
    // planExpiresAt só marca a próxima cobrança, não uma perda de acesso.
    while (true) {
      const now      = new Date();
      const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const user = await User.findOneAndUpdate(
        {
          plan: { $in: ['essencial', 'profissional'] },
          stripeSubscriptionId: null,
          planExpiresAt:     { $gte: now, $lte: deadline },
          planWarningSentAt: null,
        },
        { $set: { planWarningSentAt: now } },
        { new: false } // retorna o documento ANTES do update para ter os dados originais
      );

      if (!user) break; // nenhum usuário restante para processar

      try {
        const msLeft   = new Date(user.planExpiresAt) - now;
        const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

        await this.emailService.sendPlanExpiryWarning({
          email: user.email,
          name:  user.name,
          daysLeft,
          expiryDate: new Date(user.planExpiresAt).toLocaleDateString('pt-BR'),
          planName: PLAN_LABEL[user.plan] || user.plan,
          renewUrl,
        });

        notified++;
        logger.info(`PlanExpiryWarningJob: aviso enviado para ${user.email} (${daysLeft} dia(s) restantes)`);
      } catch (err) {
        errors++;
        // Rollback da marcação para que o cron tente novamente amanhã
        await User.updateOne({ _id: user._id }, { $set: { planWarningSentAt: null } });
        logger.error(`PlanExpiryWarningJob: falha ao notificar ${user.email}`, {
          message: err.message,
          stack:   err.stack,
        });
      }
    }

    logger.info(`PlanExpiryWarningJob: concluído — ${notified} notificados, ${errors} erros`);
    return { notified, errors };
  }
}

module.exports = PlanExpiryWarningJob;
