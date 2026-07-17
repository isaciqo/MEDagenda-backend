const logger = require('../../../lib/logger');

class LogoutOperation {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(user_id) {
    await this.userRepository.incrementTokenVersion(user_id);
    logger.info('logout: token invalidado', { user_id });
  }
}

module.exports = LogoutOperation;
