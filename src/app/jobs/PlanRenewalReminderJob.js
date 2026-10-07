const User = require('../../database/models/user/userModel');
const logger = require('../../lib/logger');

const PLAN_LABEL = { essencial: 'Essencial', profissional: 'Profissional' };

// Caso oposto do PlanExpiryWarningJob: aqui a assinatura está ATIVA
// (stripeSubscriptionId preenchido) — a Stripe vai cobrar de novo sozinha
// dentro de alguns dias, não cancelar o acesso. É um aviso de transparência
// ("sua assinatura vai renovar"), não um aviso de perda de acesso.
class PlanRenewalReminderJob {
  constructor({ emailService }) {
    this.emailService = emailService;
  }

  async run() {
    logger.info('PlanRenewalReminderJob: iniciando verificação de assinaturas renovando em breve');

    const base      = (process.env.FRONTEND_URL || 'http://localhost:8080').split(',')[0].trim();
    const manageUrl = `${base}/configuracoes`;

    let notified = 0;
    let errors   = 0;

    // Mesmo padrão atômico dos outros jobs de aviso: um usuário de cada vez
    // via findOneAndUpdate, pra múltiplas instâncias não duplicarem o envio.
    // stripeSubscriptionId preenchido é o que garante que só avisamos quem
    // vai ser cobrado de novo — sem assinatura ativa, quem cuida disso é o
    // PlanExpiryWarningJob (perda de acesso), não este job.
    while (true) {
      const now      = new Date();
      const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const user = await User.findOneAndUpdate(
        {
          plan: { $in: ['essencial', 'profissional'] },
          stripeSubscriptionId: { $ne: null },
          // cancelamento agendado = não vai ser cobrado, quem avisa é o PlanExpiryWarningJob
          planCancelAtPeriodEnd: { $ne: true },
          planExpiresAt:            { $gte: now, $lte: deadline },
          planRenewalWarningSentAt: null,
        },
        { $set: { planRenewalWarningSentAt: now } },
        { new: false } // retorna o documento ANTES do update para ter os dados originais
      );

      if (!user) break; // nenhum usuário restante para processar

      try {
        const msLeft   = new Date(user.planExpiresAt) - now;
        const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

        await this.emailService.sendPlanRenewalReminder({
          email: user.email,
          name:  user.name,
          daysLeft,
          renewalDate: new Date(user.planExpiresAt).toLocaleDateString('pt-BR'),
          planName: PLAN_LABEL[user.plan] || user.plan,
          manageUrl,
        });

        notified++;
        logger.info(`PlanRenewalReminderJob: lembrete enviado para ${user.email} (${daysLeft} dia(s) restantes)`);
      } catch (err) {
        errors++;
        // Rollback da marcação para que o cron tente novamente amanhã
        await User.updateOne({ _id: user._id }, { $set: { planRenewalWarningSentAt: null } });
        logger.error(`PlanRenewalReminderJob: falha ao notificar ${user.email}`, {
          message: err.message,
          stack:   err.stack,
        });
      }
    }

    logger.info(`PlanRenewalReminderJob: concluído — ${notified} notificados, ${errors} erros`);
    return { notified, errors };
  }
}

module.exports = PlanRenewalReminderJob;
