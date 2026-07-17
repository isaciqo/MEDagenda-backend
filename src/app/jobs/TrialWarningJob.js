const User = require('../../database/models/user/userModel');
const logger = require('../../lib/logger');

class TrialWarningJob {
  constructor({ emailService }) {
    this.emailService = emailService;
  }

  async run() {
    logger.info('TrialWarningJob: iniciando verificação de trials expirando');

    const base       = (process.env.FRONTEND_URL || 'http://localhost:8080').split(',')[0].trim();
    const upgradeUrl = `${base}/configuracoes`;

    let notified = 0;
    let errors   = 0;

    // Processa um usuário de cada vez com findOneAndUpdate atômico.
    // Garante que múltiplas instâncias do servidor não enviem emails duplicados:
    // apenas o processo que executar o update primeiro "reserva" o usuário.
    while (true) {
      const now      = new Date();
      const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const user = await User.findOneAndUpdate(
        {
          plan: 'trial',
          isConfirmed: true,
          trialExpiresAt:    { $gte: now, $lte: deadline },
          trialWarningSentAt: null,
        },
        { $set: { trialWarningSentAt: now } },
        { new: false } // retorna o documento ANTES do update para ter os dados originais
      );

      if (!user) break; // nenhum usuário restante para processar

      try {
        const msLeft   = new Date(user.trialExpiresAt) - now;
        const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

        await this.emailService.sendTrialExpiryWarning({
          email: user.email,
          name:  user.name,
          daysLeft,
          upgradeUrl,
        });

        notified++;
        logger.info(`TrialWarningJob: aviso enviado para ${user.email} (${daysLeft} dia(s) restantes)`);
      } catch (err) {
        errors++;
        // Rollback da marcação para que o cron tente novamente amanhã
        await User.updateOne({ _id: user._id }, { $set: { trialWarningSentAt: null } });
        logger.error(`TrialWarningJob: falha ao notificar ${user.email}`, {
          message: err.message,
          stack:   err.stack,
        });
      }
    }

    logger.info(`TrialWarningJob: concluído — ${notified} notificados, ${errors} erros`);
    return { notified, errors };
  }
}

module.exports = TrialWarningJob;
