const logger = require('../../../lib/logger');

class ChangePasswordOperation {
  constructor({ userRepository, hashPasswordService }) {
    this.userRepository = userRepository;
    this.hashPasswordService = hashPasswordService;
  }

  async execute({ user_id, currentPassword, newPassword }) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const isValid = await this.hashPasswordService.compare(currentPassword, user.password);
    if (!isValid) {
      logger.warn('change-password: senha atual incorreta', { user_id });
      const err = new Error('Current password is incorrect');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await this.hashPasswordService.hash(newPassword);
    await this.userRepository.update(user_id, { password: hashedPassword });

    logger.info('change-password: senha alterada com sucesso', { user_id });
    return { message: 'Password changed successfully' };
  }
}

module.exports = ChangePasswordOperation;
