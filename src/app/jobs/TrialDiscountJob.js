const User = require('../../database/models/user/userModel');
const logger = require('../../lib/logger');
const { trialDiscountEmailEnabled } = require('../../lib/featureFlags');

// Cupom de "última chance" perto do fim do trial. Roda separado do
// TrialWarningJob (que já avisa com até 7 dias de antecedência, sem oferta
// nenhuma) pra poder ligar/desligar essa campanha e ajustar a janela de
// urgência sem mexer no aviso genérico.
//
// Atrás de feature flag (TRIAL_DISCOUNT_EMAIL_ENABLED) + cupom vindo de env
// var (TRIAL_DISCOUNT_CODE) — sem os dois, o job nem consulta o banco.
class TrialDiscountJob {
  constructor({ emailService }) {
    this.emailService = emailService;
  }

  // Só nos últimos 3 dias de trial — mais perto do fim que o aviso genérico
  // do TrialWarningJob (7 dias), de propósito: é a cutucada final, não o
  // primeiro aviso.
  static DAYS_BEFORE = 3;

  async run() {
    if (!trialDiscountEmailEnabled()) {
      logger.info('TrialDiscountJob: desligado (TRIAL_DISCOUNT_EMAIL_ENABLED != true), pulando');
      return { notified: 0, errors: 0, skipped: true };
    }

    const discountCode = process.env.TRIAL_DISCOUNT_CODE;
    if (!discountCode) {
      logger.warn('TrialDiscountJob: flag ligada mas TRIAL_DISCOUNT_CODE não configurado, pulando');
      return { notified: 0, errors: 0, skipped: true };
    }
    const discountPercent = parseInt(process.env.TRIAL_DISCOUNT_PERCENT, 10) || 50;

    logger.info('TrialDiscountJob: iniciando verificação de trials perto de expirar');

    const base       = (process.env.FRONTEND_URL || 'http://localhost:8080').split(',')[0].trim();
    const upgradeUrl = `${base}/configuracoes`;

    let notified = 0;
    let errors   = 0;

    // Mesmo padrão atômico do TrialWarningJob: um usuário de cada vez via
    // findOneAndUpdate, pra múltiplas instâncias do servidor não duplicarem
    // o envio.
    while (true) {
      const now      = new Date();
      const deadline = new Date(now.getTime() + TrialDiscountJob.DAYS_BEFORE * 24 * 60 * 60 * 1000);

      const user = await User.findOneAndUpdate(
        {
          plan: 'trial',
          isConfirmed: true,
          trialExpiresAt:      { $gte: now, $lte: deadline },
          trialDiscountSentAt: null,
        },
        { $set: { trialDiscountSentAt: now } },
        { new: false } // retorna o documento ANTES do update para ter os dados originais
      );

      if (!user) break; // nenhum usuário restante para processar

      try {
        const msLeft   = new Date(user.trialExpiresAt) - now;
        const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

        await this.emailService.sendTrialDiscountOffer({
          email: user.email,
          name:  user.name,
          daysLeft,
          discountCode,
          discountPercent,
          upgradeUrl,
        });

        notified++;
        logger.info(`TrialDiscountJob: oferta enviada para ${user.email} (${daysLeft} dia(s) restantes)`);
      } catch (err) {
        errors++;
        // Rollback da marcação para que o cron tente novamente amanhã
        await User.updateOne({ _id: user._id }, { $set: { trialDiscountSentAt: null } });
        logger.error(`TrialDiscountJob: falha ao notificar ${user.email}`, {
          message: err.message,
          stack:   err.stack,
        });
      }
    }

    logger.info(`TrialDiscountJob: concluído — ${notified} notificados, ${errors} erros`);
    return { notified, errors };
  }
}

module.exports = TrialDiscountJob;
