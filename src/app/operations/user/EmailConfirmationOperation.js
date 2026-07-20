const logger = require('../../../lib/logger');

class EmailConfirmationOperation {
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
      const err = new Error('Token de confirmação inválido ou expirado');
      err.statusCode = 400;
      throw err;
    }

    const user = await this.userRepository.findByEmail(decoded.email);
    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (user.isConfirmed) {
      return { message: 'E-mail já confirmado', user_id: user.user_id };
    }

    await this.userRepository.update(user.user_id, { isConfirmed: true });
    logger.info('email-confirmation: conta confirmada', { email: user.email });

    // AU04: e-mail de boas-vindas após confirmação
    try {
      await this.emailService.sendWelcomeEmail({ email: user.email, name: user.name });
    } catch (err) {
      logger.error('email-confirmation: falha ao enviar e-mail de boas-vindas', { email: user.email, error: err.message });
    }

    return { message: 'E-mail confirmado com sucesso', user_id: user.user_id };
  }
}

module.exports = EmailConfirmationOperation;
