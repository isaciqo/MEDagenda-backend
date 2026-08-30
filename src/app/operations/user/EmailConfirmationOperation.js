const logger = require('../../../lib/logger');

class EmailConfirmationOperation {
  constructor({ userRepository, tokenService, emailService, processReferralOperation }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.emailService = emailService;
    this.processReferralOperation = processReferralOperation;
  }

  async execute(token) {
    let decoded;
    try {
      decoded = this.tokenService.verify(token);
    } catch {
      const err = new Error('Token de confirmação inválido ou expirado');
      err.statusCode = 400;
      throw err;
    }

    const user = await this.userRepository.findByEmail(decoded.email);
    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (user.isConfirmed) {
      return { message: 'E-mail já confirmado', user_id: user.user_id };
    }

    await this.userRepository.update(user.user_id, { isConfirmed: true });
    logger.info('email-confirmation: conta confirmada', { email: user.email });

    if (user.pendingReferralCode) {
      try {
        await this.processReferralOperation.execute({
          code: user.pendingReferralCode,
          referredUserId: user.user_id,
        });
        await this.userRepository.update(user.user_id, { pendingReferralCode: null });
      } catch (err) {
        logger.warn('email-confirmation: falha ao processar indicação pendente', { error: err.message });
      }
    }

    // AU04: e-mail de boas-vindas após confirmação
    try {
      // Calcula os dias restantes a partir de trialExpiresAt em vez de
      // assumir um número fixo: quem se cadastrou por indicação válida ganha
      // mais dias de trial na hora do cadastro (ver src/lib/trialPeriod.js).
      const trialDays = user.trialExpiresAt
        ? Math.max(1, Math.round((new Date(user.trialExpiresAt) - Date.now()) / (24 * 60 * 60 * 1000)))
        : 15;
      await this.emailService.sendWelcomeEmail({ email: user.email, name: user.name, trialDays });
    } catch (err) {
      logger.error('email-confirmation: falha ao enviar e-mail de boas-vindas', { email: user.email, error: err.message });
    }

    return { message: 'E-mail confirmado com sucesso', user_id: user.user_id };
  }
}

module.exports = EmailConfirmationOperation;
