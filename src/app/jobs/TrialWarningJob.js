const logger = require('../../lib/logger');

class TrialWarningJob {
  constructor({ userRepository, emailService }) {
    this.userRepository = userRepository;
    this.emailService   = emailService;
  }

  async run() {
    logger.info('TrialWarningJob: iniciando verificação de trials expirando');

    const users = await this.userRepository.findExpiringTrials(7);

    if (users.length === 0) {
      logger.info('TrialWarningJob: nenhum usuário a notificar');
      return { notified: 0, errors: 0 };
    }

    logger.info(`TrialWarningJob: ${users.length} usuário(s) a notificar`);

    let notified = 0;
    let errors   = 0;

    for (const user of users) {
      try {
        const now      = new Date();
        const expires  = new Date(user.trialExpiresAt);
        const msLeft   = expires - now;
        const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

        const upgradeUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/configuracoes`;

        await this.emailService.sendTrialExpiryWarning({
          email:      user.email,
          name:       user.name,
          daysLeft,
          upgradeUrl,
        });

        await this.userRepository.update(user.user_id, {
          trialWarningSentAt: now,
        });

        notified++;
        logger.info(`TrialWarningJob: aviso enviado para ${user.email} (${daysLeft} dia(s) restantes)`);
      } catch (err) {
        errors++;
        logger.error(`TrialWarningJob: falha ao notificar ${user.email}`, {
          message: err.message,
        });
      }
    }

    logger.info(`TrialWarningJob: concluído — ${notified} notificados, ${errors} erros`);
    return { notified, errors };
  }
}

module.exports = TrialWarningJob;
