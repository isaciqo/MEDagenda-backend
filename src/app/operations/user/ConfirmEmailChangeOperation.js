const logger = require('../../../lib/logger');

class ConfirmEmailChangeOperation {
  constructor({ userRepository, tokenService, emailService }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.emailService = emailService;
  }

  async execute(token) {
    let decoded;
    try {
      decoded = this.tokenService.verify(token);
    } catch {
      const err = new Error('Link de confirmação inválido ou expirado');
      err.statusCode = 400;
      throw err;
    }

    if (decoded.action !== 'email-change') {
      const err = new Error('Link de confirmação inválido');
      err.statusCode = 400;
      throw err;
    }

    const user = await this.userRepository.findById(decoded.user_id);
    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    // Se o médico pediu outra troca depois de gerar esse link, o link antigo não vale mais.
    if (user.pendingEmail !== decoded.newEmail) {
      const err = new Error('Este link de confirmação não é mais válido');
      err.statusCode = 400;
      throw err;
    }

    const existing = await this.userRepository.findByEmail(decoded.newEmail);
    if (existing && existing.user_id !== user.user_id) {
      const err = new Error('Este e-mail já está em uso');
      err.statusCode = 409;
      throw err;
    }

    const oldEmail = user.email;
    await this.userRepository.update(user.user_id, {
      email: decoded.newEmail,
      pendingEmail: null,
      pendingEmailRequestedAt: null,
    });
    await this.userRepository.incrementTokenVersion(user.user_id);

    logger.info('confirm-email-change: e-mail alterado', { user_id: user.user_id, oldEmail, newEmail: decoded.newEmail });

    try {
      await this.emailService.sendEmailChangedNotice({ email: oldEmail, name: user.name, newEmail: decoded.newEmail });
    } catch (err) {
      logger.error('confirm-email-change: falha ao enviar aviso pro e-mail antigo', { user_id: user.user_id, error: err.message });
    }

    return { message: 'E-mail alterado com sucesso' };
  }
}

module.exports = ConfirmEmailChangeOperation;
