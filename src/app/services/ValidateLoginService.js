const logger = require('../../lib/logger');

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

class ValidateLoginService {
  constructor({ userRepository, hashPasswordService }) {
    this.userRepository = userRepository;
    this.hashPasswordService = hashPasswordService;
  }

  async validate(email, password) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      logger.warn('login: conta bloqueada', { email, minutesLeft });
      const err = new Error(`Conta bloqueada. Tente novamente em ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''}.`);
      err.statusCode = 423;
      throw err;
    }

    if (!user.isConfirmed) {
      logger.warn('login: conta não confirmada', { email });
      const err = new Error('Conta não confirmada. Verifique seu e-mail.');
      err.statusCode = 403;
      throw err;
    }

    const isValid = await this.hashPasswordService.compare(password, user.password);

    if (!isValid) {
      const attempts = (user.loginAttempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await this.userRepository.lockAccount(user.user_id);
        logger.warn('login: conta bloqueada após tentativas', { email, attempts });
        const err = new Error(`Conta bloqueada por ${LOCK_DURATION_MS / 60000} minutos após ${MAX_ATTEMPTS} tentativas falhas.`);
        err.statusCode = 423;
        throw err;
      }
      await this.userRepository.incrementLoginAttempts(user.user_id);
      logger.warn('login: senha incorreta', { email, attempts, remaining: MAX_ATTEMPTS - attempts });
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    if (user.loginAttempts > 0 || user.lockUntil) {
      await this.userRepository.resetLoginAttempts(user.user_id);
    }

    return user;
  }
}

module.exports = ValidateLoginService;
