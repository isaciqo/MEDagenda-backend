const HashPasswordService = require('../../../src/app/services/HashPasswordService');

describe('HashPasswordService', () => {
  let service;

  beforeEach(() => {
    service = new HashPasswordService();
  });

  describe('hash', () => {
    it('should return a hashed password string', async () => {
      const hash = await service.hash('mypassword');
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe('mypassword');
    });

    it('should produce different hashes for the same password (salt)', async () => {
      const hash1 = await service.hash('mypassword');
      const hash2 = await service.hash('mypassword');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true for a matching password', async () => {
      const hash = await service.hash('mypassword');
      const result = await service.compare('mypassword', hash);
      expect(result).toBe(true);
    });

    it('should return false for a non-matching password', async () => {
      const hash = await service.hash('mypassword');
      const result = await service.compare('wrongpassword', hash);
      expect(result).toBe(false);
    });
  });
});
