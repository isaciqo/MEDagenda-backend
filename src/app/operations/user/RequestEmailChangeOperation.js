const logger = require('../../../lib/logger');
const { isDisposableEmail } = require('../../../lib/disposableEmail');

const RESEND_COOLDOWN_MS = 24 * 60 * 60 * 1000;

class RequestEmailChangeOperation {
  constructor({ userRepository, hashPasswordService, tokenService, emailService }) {
    this.userRepository = userRepository;
    this.hashPasswordService = hashPasswordService;
    this.tokenService = tokenService;
    this.emailService = emailService;
  }

  async execute({ user_id, currentPassword, newEmail }) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (user.googleId) {
      const err = new Error('Contas conectadas ao Google usam o e-mail da conta Google e não podem trocar por aqui');
      err.statusCode = 400;
      throw err;
    }

    const isValid = await this.hashPasswordService.compare(currentPassword, user.password);
    if (!isValid) {
      logger.warn('request-email-change: senha atual incorreta', { user_id });
      const err = new Error('Senha atual incorreta');
      err.statusCode = 400;
      throw err;
    }

    const existing = await this.userRepository.findByEmail(newEmail);
    if (existing && existing.user_id !== user_id) {
      const err = new Error('Este e-mail já está em uso');
      err.statusCode = 409;
      throw err;
    }

    if (isDisposableEmail(newEmail)) {
      const err = new Error('Não aceitamos e-mails temporários ou descartáveis. Use um e-mail válido.');
      err.statusCode = 400;
      throw err;
    }

    // Limite de reenvio: só se aplica a reenviar pro MESMO e-mail já pendente.
    // Pedir a troca pra um e-mail diferente (ex: corrigindo um erro de digitação) funciona na hora.
    if (
      user.pendingEmail === newEmail &&
      user.pendingEmailRequestedAt &&
      Date.now() - new Date(user.pendingEmailRequestedAt).getTime() < RESEND_COOLDOWN_MS
    ) {
      const err = new Error('Você já solicitou a troca para este e-mail hoje. Tente novamente mais tarde.');
      err.statusCode = 429;
      throw err;
    }

    const now = new Date();
    await this.userRepository.update(user_id, {
      pendingEmail: newEmail,
      pendingEmailRequestedAt: now,
    });

    const token = this.tokenService.generateTempToken({ user_id, newEmail, action: 'email-change' }, '1h');
    await this.emailService.sendEmailChangeConfirmation({ email: newEmail, name: user.name, token });

    logger.info('request-email-change: confirmação enviada', { user_id, newEmail });
    return { message: 'Enviamos um link de confirmação para o novo e-mail.', pendingEmail: newEmail };
  }
}

module.exports = RequestEmailChangeOperation;
