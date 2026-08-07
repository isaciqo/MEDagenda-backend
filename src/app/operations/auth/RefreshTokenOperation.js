const logger = require('../../../lib/logger');

class RefreshTokenOperation {
  constructor({ tokenService, userRepository }) {
    this.tokenService = tokenService;
    this.userRepository = userRepository;
  }

  async execute(refreshToken) {
    if (!refreshToken) {
      const err = new Error('Refresh token ausente.');
      err.statusCode = 401;
      throw err;
    }

    let decoded;
    try {
      decoded = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      const err = new Error('Refresh token inválido ou expirado.');
      err.statusCode = 401;
      throw err;
    }

    const user = await this.userRepository.findById(decoded.user_id);
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      const err = new Error('Refresh token revogado. Faça login novamente.');
      err.statusCode = 401;
      throw err;
    }

    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };
    const accessToken = this.tokenService.generate(payload);

    logger.info('refresh: novo access token emitido', { user_id: user.user_id });

    return { accessToken };
  }
}

module.exports = RefreshTokenOperation;
