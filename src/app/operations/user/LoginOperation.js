const logger = require('../../../lib/logger');

class LoginOperation {
  constructor({ validateLoginService, tokenService }) {
    this.validateLoginService = validateLoginService;
    this.tokenService = tokenService;
  }

  async execute({ email, password }) {
    logger.info('login: tentativa', { email });

    let user;
    try {
      user = await this.validateLoginService.validate(email, password);
    } catch (err) {
      logger.warn('login: falhou', { email, reason: err.message });
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
