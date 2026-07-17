const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');

class CreateUserOperation {
  constructor({ userRepository, hashPasswordService, tokenService, emailService }) {
    this.userRepository = userRepository;
    this.hashPasswordService = hashPasswordService;
    this.tokenService = tokenService;
    this.emailService = emailService;
  }

  async execute({ name, email, password }) {
    logger.info('register: tentativa de cadastro', { email });

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      logger.warn('register: e-mail já cadastrado', { email });
      const err = new Error('Email already in use');
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await this.hashPasswordService.hash(password);

    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);

    const user = await this.userRepository.create({
      user_id: uuidv4(),
      name: name || email.split('@')[0],
      email,
      password: hashedPassword,
      isConfirmed: false,
      plan: 'trial',
      trialExpiresAt,
    });

    logger.info('register: usuário criado', { email, user_id: user.user_id });

    const confirmToken = this.tokenService.generateTempToken({ email }, '1h');

    try {
      await this.emailService.sendConfirmationEmail({ email, name: user.name, token: confirmToken });
      logger.info('register: e-mail de confirmação enviado', { email });
    } catch (err) {
      logger.error('register: falha ao enviar e-mail de confirmação', { email, error: err.message });
    }

    return { message: 'Verifique seu e-mail para ativar sua conta.' };
  }
}

module.exports = CreateUserOperation;
