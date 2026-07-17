const crypto = require('crypto');
const logger = require('../../../lib/logger');

class RequestPasswordResetOperation {
  constructor({ userRepository, emailService }) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  async execute(email) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      logger.warn('forgot-password: email não encontrado, resposta genérica enviada', { email });
      return { message: 'If this email exists, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora

    await this.userRepository.update(user.user_id, {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: expires,
    });

    logger.info('forgot-password: enviando e-mail de redefinição', { email, userId: user.user_id });

    try {
      await this.emailService.sendPasswordResetEmail({ email, name: user.name, token });
      logger.info('forgot-password: e-mail enviado com sucesso', { email });
    } catch (err) {
      logger.error('forgot-password: falha ao enviar e-mail', { email, error: err.message });
      throw err;
    }

    return { message: 'If this email exists, a reset link has been sent.' };
  }
}

module.exports = RequestPasswordResetOperation;
