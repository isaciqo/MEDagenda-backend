const logger = require('../../../lib/logger');

class RequestPasswordResetOperation {
  constructor({ userRepository, tokenService, emailService }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.emailService = emailService;
  }

  async execute(email) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      logger.warn('forgot-password: email não encontrado, resposta genérica enviada', { email });
      return { message: 'If this email exists, a reset link has been sent.' };
    }

    const token = this.tokenService.generateTempToken({ email }, '1h');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.update(user.user_id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    logger.info('forgot-password: enviando e-mail de redefinição', { email, userId: user.user_id });

    try {
      const response = await this.emailService.sendPasswordResetEmail({ email, name: user.name, token });
      logger.info('forgot-password: e-mail enviado com sucesso', { email, response });
    } catch (err) {
      logger.error('forgot-password: falha ao enviar e-mail', { email, message: err.message, stack: err.stack });
      throw err;
    }

    return { message: 'If this email exists, a reset link has been sent.' };
  }
}

module.exports = RequestPasswordResetOperation;
