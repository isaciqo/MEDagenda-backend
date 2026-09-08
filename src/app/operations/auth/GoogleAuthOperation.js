const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const logger = require('../../../lib/logger');
const { computeTrialExpiresAt } = require('../../../lib/trialPeriod');

class GoogleAuthOperation {
  constructor({ googleAuthService, userRepository, tokenService, emailService, processReferralOperation }) {
    this.googleAuthService        = googleAuthService;
    this.userRepository           = userRepository;
    this.tokenService             = tokenService;
    this.emailService             = emailService;
    this.processReferralOperation = processReferralOperation;
  }

  async execute(credential, termsAccepted = false, referralCode = null) {
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
          logger.info('google-auth: novo usuário sem aceite dos termos', { email });
          return { needsTermsAcceptance: true };
        }

        // Mesma regra do cadastro manual: trial maior pra quem chegou por um
        // link de indicação válido (ver CreateUserOperation e trialPeriod.js).
        // pendingReferralCode é gravado aqui e creditado logo abaixo, junto com
        // a confirmação imediata da conta (o fluxo manual faz isso só quando o
        // e-mail é confirmado, em EmailConfirmationOperation).
        const referrer = referralCode ? await this.userRepository.findByReferralCode(referralCode) : null;
        const trialExpiresAt = computeTrialExpiresAt(!!referrer);

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
          pendingReferralCode: referralCode || null,
          termsAcceptedAt: new Date(),
        });

        logger.info('google-auth: novo usuário criado', { email, user_id: user.user_id });
      }
    }

    // O Google já entrega o e-mail verificado (GoogleAuthService.verifyToken
    // rejeita qualquer token sem email_verified), então não faz sentido um
    // segundo passo de confirmação por e-mail: seria fricção à toa e prende o
    // usuário fora da conta que ele acabou de criar. Confirma na hora.
    //
    // Isso vale tanto pro usuário novo (criado logo acima com isConfirmed:false)
    // quanto pra uma conta manual pré-existente que nunca confirmou: o login com
    // Google no mesmo e-mail prova a posse da caixa. Fora do fluxo Google, o
    // cadastro manual continua exigindo a confirmação por e-mail normalmente.
    if (!user.isConfirmed) {
      await this.userRepository.update(user.user_id, { isConfirmed: true });
      logger.info('google-auth: conta confirmada via Google', { email });

      // O cadastro manual credita a indicação na confirmação do e-mail
      // (EmailConfirmationOperation). Como aqui a conta já nasce confirmada,
      // processa a indicação pendente na hora e limpa o código.
      if (user.pendingReferralCode) {
        try {
          await this.processReferralOperation.execute({
            code: user.pendingReferralCode,
            referredUserId: user.user_id,
          });
          await this.userRepository.update(user.user_id, { pendingReferralCode: null });
        } catch (err) {
          logger.warn('google-auth: falha ao processar indicação pendente', { error: err.message });
        }
      }

      // Mesmo e-mail de boas-vindas que o cadastro manual dispara ao confirmar.
      try {
        const trialDays = user.trialExpiresAt
          ? Math.max(1, Math.round((new Date(user.trialExpiresAt) - Date.now()) / (24 * 60 * 60 * 1000)))
          : 15;
        await this.emailService.sendWelcomeEmail({ email: user.email, name: user.name, trialDays });
      } catch (err) {
        logger.error('google-auth: falha ao enviar e-mail de boas-vindas', { email, error: err.message });
      }
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
