const logger = require('../../../lib/logger');

class LoginOperation {
  constructor({ validateLoginService, tokenService, resendConfirmationEmailOperation }) {
    this.validateLoginService = validateLoginService;
    this.tokenService = tokenService;
    this.resendConfirmationEmailOperation = resendConfirmationEmailOperation;
  }

  async execute({ email, password }) {
    logger.info('login: tentativa', { email });

    let user;
    try {
      user = await this.validateLoginService.validate(email, password);
    } catch (err) {
      logger.warn('login: falhou', { email, reason: err.message });

      // Conta não confirmada (403): tenta reenviar o link de confirmação
      // (respeitando o cooldown de 24h) e conta pro usuário na mensagem.
      if (err.statusCode === 403) {
        const { sent, reason } = await this.resendConfirmationEmailOperation.execute(email);
        if (sent) {
          err.message = 'Conta não confirmada. Enviamos um novo link de confirmação para o seu e-mail.';
        } else if (reason === 'cooldown') {
          err.message = 'Conta não confirmada. Já enviamos um link recentemente. Verifique seu e-mail, inclusive a caixa de spam.';
        }
      }

      throw err;
    }

    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };
    const accessToken = this.tokenService.generate(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    logger.info('login: sucesso', { email, user_id: user.user_id });

    return { accessToken, refreshToken };
  }
}

module.exports = LoginOperation;
