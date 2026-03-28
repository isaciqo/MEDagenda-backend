const jwt = require('jsonwebtoken');
const TokenService = require('../../../src/app/services/TokenService');

describe('TokenService', () => {
  const secret = 'test-secret';
  let service;

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    process.env.JWT_EXPIRES_IN = '60m';
    service = new TokenService();
  });

  describe('generate', () => {
    it('should generate a valid JWT token', () => {
      const token = service.generate({ user_id: '123', email: 'a@b.com' });
      const decoded = jwt.verify(token, secret);
      expect(decoded.user_id).toBe('123');
      expect(decoded.email).toBe('a@b.com');
    });
  });

  describe('verify', () => {
    it('should return decoded payload for a valid token', () => {
      const token = jwt.sign({ user_id: '123' }, secret);
      const decoded = service.verify(token);
      expect(decoded.user_id).toBe('123');
    });

    it('should throw an error for an invalid token', () => {
      expect(() => service.verify('invalid.token.here')).toThrow();
    });
  });

  describe('generateTempToken', () => {
    it('should generate a token with a custom expiry', () => {
      const token = service.generateTempToken({ email: 'a@b.com' }, '1h');
      const decoded = jwt.verify(token, secret);
      expect(decoded.email).toBe('a@b.com');
    });

    it('should use default 1h expiry when not specified', () => {
      const token = service.generateTempToken({ email: 'a@b.com' });
      const decoded = jwt.verify(token, secret);
      expect(decoded.email).toBe('a@b.com');
    });
  });
});
