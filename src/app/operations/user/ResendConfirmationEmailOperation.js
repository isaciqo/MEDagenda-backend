const logger = require('../../../lib/logger');
const { emailConfirmationRequired } = require('../../../lib/featureFlags');

// Cooldown entre e-mails de confirmação. Impede que cada tentativa de login ou
// cada clique num link vencido dispare um e-mail novo.
const RESEND_COOLDOWN_MS = 24 * 60 * 60 * 1000;

class ResendConfirmationEmailOperation {
  constructor({ userRepository, tokenService, emailService }) {
    this.userRepository = userRepository;
    this.tokenService   = tokenService;
    this.emailService    = emailService;
  }

  // Reenvia o e-mail de confirmação SE a conta existe, não está confirmada e o
  // último e-mail saiu há mais de 24h. Não lança erro: devolve o que aconteceu
  // pra quem chamou montar a mensagem certa pro usuário.
  //   { sent: true }
  //   { sent: false, reason: 'not_required' | 'not_found' | 'already_confirmed' | 'cooldown' }
  async execute(email) {
    if (!emailConfirmationRequired()) return { sent: false, reason: 'not_required' };
    if (!email) return { sent: false, reason: 'not_found' };

    const user = await this.userRepository.findByEmail(email);
    if (!user) return { sent: false, reason: 'not_found' };
    if (user.isConfirmed) return { sent: false, reason: 'already_confirmed' };

    const last = user.lastConfirmationEmailSentAt;
    if (last && Date.now() - new Date(last).getTime() < RESEND_COOLDOWN_MS) {
      return { sent: false, reason: 'cooldown' };
    }

    const token = this.tokenService.generateTempToken({ email: user.email }, '24h');

    await this.emailService.sendConfirmationEmail({
      email: user.email,
      name:  user.name,
      token,
      isReminder: true,
    });
    await this.userRepository.update(user.user_id, { lastConfirmationEmailSentAt: new Date() });

    logger.info('resend-confirmation: novo link enviado', { email: user.email });
    return { sent: true };
  }
}

module.exports = ResendConfirmationEmailOperation;
