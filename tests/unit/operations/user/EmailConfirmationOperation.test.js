const EmailConfirmationOperation = require('../../../../src/app/operations/user/EmailConfirmationOperation');

describe('EmailConfirmationOperation', () => {
  let operation;
  let userRepository, tokenService;

  beforeEach(() => {
    userRepository = { findByEmail: jest.fn(), update: jest.fn() };
    tokenService = { verify: jest.fn() };
    operation = new EmailConfirmationOperation({ userRepository, tokenService });
  });

  it('should throw when token is invalid', async () => {
    tokenService.verify.mockImplementation(() => { throw new Error('invalid'); });
    await expect(operation.execute('badtoken')).rejects.toThrow('Invalid or expired confirmation token');
  });

  it('should throw "User not found" when decoded email has no user', async () => {
    tokenService.verify.mockReturnValue({ email: 'a@b.com' });
    userRepository.findByEmail.mockResolvedValue(null);
    await expect(operation.execute('validtoken')).rejects.toThrow('User not found');
  });

  it('should return "already confirmed" message if user is already confirmed', async () => {
    tokenService.verify.mockReturnValue({ email: 'a@b.com' });
    userRepository.findByEmail.mockResolvedValue({ user_id: '1', isConfirmed: true });

    const result = await operation.execute('validtoken');
    expect(result).toEqual({ message: 'Email already confirmed' });
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('should update isConfirmed and return success message', async () => {
    tokenService.verify.mockReturnValue({ email: 'a@b.com' });
    userRepository.findByEmail.mockResolvedValue({ user_id: '1', isConfirmed: false });
    userRepository.update.mockResolvedValue();

    const result = await operation.execute('validtoken');

    expect(userRepository.update).toHaveBeenCalledWith('1', { isConfirmed: true });
    expect(result).toEqual({ message: 'Email confirmed successfully' });
  });
});
