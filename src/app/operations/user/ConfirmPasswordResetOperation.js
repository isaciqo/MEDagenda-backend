const crypto = require('crypto');
const logger = require('../../../lib/logger');

class ConfirmPasswordResetOperation {
  constructor({ userRepository, hashPasswordService }) {
    this.userRepository = userRepository;
    this.hashPasswordService = hashPasswordService;
  }

  async execute({ token, newPassword }) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userRepository.findByResetTokenHash(tokenHash);
    if (!user) {
      logger.warn('reset-password: token inválido ou expirado');
      const err = new Error('Token inválido ou expirado');
      err.status = 400;
      throw err;
    }

    const hashedPassword = await this.hashPasswordService.hash(newPassword);

    await this.userRepository.update(user.user_id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    logger.info('reset-password: senha redefinida com sucesso', { user_id: user.user_id });
    return { message: 'Password reset successfully' };
  }
}

module.exports = ConfirmPasswordResetOperation;
