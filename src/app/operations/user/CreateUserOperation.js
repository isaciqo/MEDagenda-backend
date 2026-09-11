const { v4: uuidv4 } = require('uuid');
const logger = require('../../../lib/logger');
const { isDisposableEmail } = require('../../../lib/disposableEmail');
const { computeTrialExpiresAt } = require('../../../lib/trialPeriod');
const { emailConfirmationRequired } = require('../../../lib/featureFlags');

class CreateUserOperation {
  constructor({ userRepository, hashPasswordService, tokenService, emailService, processReferralOperation }) {
    this.userRepository = userRepository;
    this.hashPasswordService = hashPasswordService;
    this.tokenService = tokenService;
    this.emailService = emailService;
    this.processReferralOperation = processReferralOperation;
  }

  async execute({ name, email, password, referralCode = null, termsAccepted = false }) {
    logger.info('register: tentativa de cadastro', { email });

    // Trial com feature-set completo é caro de dar de graça em escala. E-mail
    // descartável é o jeito mais barato de fabricar contas trial infinitas
    // (ver ANALISE_ABUSO_CUSTO.md, Business-Flow-04).
    if (isDisposableEmail(email)) {
      logger.warn('register: domínio de e-mail descartável bloqueado', { email });
      const err = new Error('Não aceitamos e-mails temporários ou descartáveis. Use um e-mail válido.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      logger.warn('register: e-mail já cadastrado', { email });
      const err = new Error('Email already in use');
      err.statusCode = 409;
      throw err;
    }

    // Defesa em profundidade: a rota já valida isso via Joi (authSchemas.js),
    // mas a operação não deveria confiar cegamente em quem a chama.
    if (!termsAccepted) {
      const err = new Error('É necessário aceitar a Política de Privacidade para criar uma conta.');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await this.hashPasswordService.hash(password);

    // Trial maior pra quem chega por um link de indicação válido. Só conta
    // se o código realmente corresponder a um médico existente, não basta
    // vir preenchido no formulário.
    const referrer = referralCode ? await this.userRepository.findByReferralCode(referralCode) : null;
    const trialExpiresAt = computeTrialExpiresAt(!!referrer);

    const requireConfirmation = emailConfirmationRequired();

    const user = await this.userRepository.create({
      user_id: uuidv4(),
      name: name || email.split('@')[0],
      email,
      password: hashedPassword,
      isConfirmed: !requireConfirmation,
      plan: 'trial',
      trialExpiresAt,
      // Só faz sentido segurar a indicação pra creditar na confirmação quando
      // existe uma confirmação. Sem ela, credita agora, logo abaixo.
      pendingReferralCode: requireConfirmation ? (referralCode || null) : null,
      termsAcceptedAt: new Date(),
      lastConfirmationEmailSentAt: requireConfirmation ? new Date() : null,
    });

    logger.info('register: usuário criado', { email, user_id: user.user_id });

    if (requireConfirmation) {
      const confirmToken = this.tokenService.generateTempToken({ email }, '24h');

      if (process.env.NODE_ENV !== 'production') {
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:8080').split(',')[0].trim();
        logger.info(`[DEV] Confirmar email → ${frontendUrl}/confirm-email?token=${confirmToken}`);
      }

      try {
        await this.emailService.sendConfirmationEmail({ email, name: user.name, token: confirmToken });
        logger.info('register: e-mail de confirmação enviado', { email });
      } catch (err) {
        logger.error('register: falha ao enviar e-mail de confirmação', { email, error: err.message });
      }

      return { message: 'Verifique seu e-mail para ativar sua conta.' };
    }

    // Confirmação de e-mail desligada: a conta já nasce ativa. Credita a
    // indicação e manda o e-mail de boas-vindas na hora (o que normalmente
    // aconteceria só na confirmação, em EmailConfirmationOperation), e devolve
    // os tokens pro frontend entrar direto no app.
    if (referrer) {
      try {
        await this.processReferralOperation.execute({ code: referralCode, referredUserId: user.user_id });
      } catch (err) {
        logger.warn('register: falha ao processar indicação', { email, error: err.message });
      }
    }

    try {
      const trialDays = user.trialExpiresAt
        ? Math.max(1, Math.round((new Date(user.trialExpiresAt) - Date.now()) / (24 * 60 * 60 * 1000)))
        : 15;
      await this.emailService.sendWelcomeEmail({ email: user.email, name: user.name, trialDays });
    } catch (err) {
      logger.error('register: falha ao enviar e-mail de boas-vindas', { email, error: err.message });
    }

    const payload = {
      user_id:      user.user_id,
      email:        user.email,
      role:         user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };

    return {
      accessToken:  this.tokenService.generate(payload),
      refreshToken: this.tokenService.generateRefreshToken(payload),
    };
  }
}

module.exports = CreateUserOperation;
