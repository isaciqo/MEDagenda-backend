const jwt = require('jsonwebtoken');

class TokenService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'secret';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '60m';
  }

  generate(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token) {
    return jwt.verify(token, this.secret);
  }

  generateTempToken(payload, expiresIn = '1h') {
    return jwt.sign(payload, this.secret, { expiresIn });
  }
}

module.exports = TokenService;
