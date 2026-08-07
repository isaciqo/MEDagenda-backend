const logger = require('../../../lib/logger');

class ChangePasswordOperation {
  constructor({ userRepository, hashPasswordService, emailService }) {
    this.userRepository = userRepository;
    this.hashPasswordService = hashPasswordService;
    this.emailService = emailService;
  }

  async execute({ user_id, currentPassword, newPassword }) {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    const isValid = await this.hashPasswordService.compare(currentPassword, user.password);
    if (!isValid) {
      logger.warn('change-password: senha atual incorreta', { user_id });
      const err = new Error('Senha atual incorreta');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await this.hashPasswordService.hash(newPassword);
    await this.userRepository.update(user_id, { password: hashedPassword });

    // AU03: invalida todas as sessões abertas em outros dispositivos
    await this.userRepository.incrementTokenVersion(user_id);

    logger.info('change-password: senha alterada, sessões anteriores invalidadas', { user_id });

    try {
      await this.emailService.sendPasswordChangedNotice({ email: user.email, name: user.name });
    } catch (err) {
      logger.error('change-password: falha ao enviar aviso de senha alterada', { user_id, error: err.message });
    }

    return { message: 'Senha alterada com sucesso' };
  }
}

module.exports = ChangePasswordOperation;
