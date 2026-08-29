const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const logger = require('../../../lib/logger');

class GoogleAuthOperation {
  constructor({ googleAuthService, userRepository, tokenService, emailService }) {
    this.googleAuthService = googleAuthService;
    this.userRepository    = userRepository;
    this.tokenService      = tokenService;
    this.emailService      = emailService;
  }

  async execute(credential, termsAccepted = false) {
    const { googleId, email, name, picture } = await this.googleAuthService.verifyToken(credential);

    logger.info('google-auth: tentativa', { email });

    // 1. Login recorrente — já tem googleId cadastrado
    let user = await this.userRepository.findByGoogleId(googleId);

    if (!user) {
      const existing = await this.userRepository.findByEmail(email);

      if (existing) {
        // 2. Vincular Google a conta existente (sem forçar isConfirmed)
        user = await this.userRepository.update(existing.user_id, {
          googleId,
          ...(picture && !existing.photoUrl ? { photoUrl: picture } : {}),
        });
        logger.info('google-auth: conta vinculada', { email });
      } else {
        // 3. Novo usuário via Google → precisa do mesmo consentimento exigido
        // no cadastro manual antes de criar a conta. Sem isso, devolve um sinal
        // pro frontend pedir o aceite e tentar de novo, sem criar nada ainda.
        if (!termsAccepted) {
          logger.info('google-auth: novo usuário sem aceite dos termos, aguardando confirmação', { email });
          return { needsTermsAcceptance: true };
        }

        const trialExpiresAt = new Date();
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);

        const unusableHash = await bcrypt.hash(uuidv4(), 10);

        user = await this.userRepository.create({
          user_id:        uuidv4(),
          name,
          email,
          password:       unusableHash,
          isConfirmed:    false,
          googleId,
          photoUrl:       picture,
          plan:           'trial',
          trialExpiresAt,
          termsAcceptedAt: new Date(),
        });

        logger.info('google-auth: novo usuário criado', { email, user_id: user.user_id });
      }
    }

    // Se a conta ainda não foi confirmada, envia e-mail e bloqueia o login
    if (!user.isConfirmed) {
      const confirmToken = this.tokenService.generateTempToken({ email: user.email }, '1h');
      try {
        await this.emailService.sendConfirmationEmail({
          email: user.email,
          name:  user.name,
          token: confirmToken,
        });
        logger.info('google-auth: e-mail de confirmação enviado', { email });
      } catch (err) {
        logger.error('google-auth: falha ao enviar e-mail de confirmação', { email, error: err.message });
      }
      return { needsConfirmation: true };
    }

    // Conta confirmada → emite JWT
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

module.exports = GoogleAuthOperation;
