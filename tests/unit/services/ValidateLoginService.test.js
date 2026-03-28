const ValidateLoginService = require('../../../src/app/services/ValidateLoginService');

describe('ValidateLoginService', () => {
  let service;
  let userRepository;
  let hashPasswordService;

  beforeEach(() => {
    userRepository = { findByEmail: jest.fn() };
    hashPasswordService = { compare: jest.fn() };
    service = new ValidateLoginService({ userRepository, hashPasswordService });
  });

  it('should throw "Invalid credentials" when user is not found', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    await expect(service.validate('a@b.com', 'pass')).rejects.toThrow('Invalid credentials');
  });

  it('should throw "Account not confirmed" when user is not confirmed', async () => {
    userRepository.findByEmail.mockResolvedValue({ isConfirmed: false });
    await expect(service.validate('a@b.com', 'pass')).rejects.toThrow('Account not confirmed');
  });

  it('should throw "Invalid credentials" when password is wrong', async () => {
    userRepository.findByEmail.mockResolvedValue({ isConfirmed: true, password: 'hashed' });
    hashPasswordService.compare.mockResolvedValue(false);
    await expect(service.validate('a@b.com', 'wrongpass')).rejects.toThrow('Invalid credentials');
  });

  it('should return the user when credentials are valid', async () => {
    const mockUser = { user_id: '1', email: 'a@b.com', isConfirmed: true, password: 'hashed' };
    userRepository.findByEmail.mockResolvedValue(mockUser);
    hashPasswordService.compare.mockResolvedValue(true);
    const result = await service.validate('a@b.com', 'pass');
    expect(result).toEqual(mockUser);
  });
});
