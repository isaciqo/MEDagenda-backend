const RequestPasswordResetOperation = require('../../../../src/app/operations/user/RequestPasswordResetOperation');

describe('RequestPasswordResetOperation', () => {
  let operation;
  let userRepository, tokenService, emailService;

  beforeEach(() => {
    userRepository = { findByEmail: jest.fn(), update: jest.fn() };
    tokenService = { generateTempToken: jest.fn().mockReturnValue('reset_token') };
    emailService = { sendPasswordResetEmail: jest.fn().mockResolvedValue() };
    operation = new RequestPasswordResetOperation({ userRepository, tokenService, emailService });
  });

  it('should return generic message when user does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    const result = await operation.execute('unknown@b.com');
    expect(result).toEqual({ message: 'If this email exists, a reset link has been sent.' });
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should send reset email and return generic message when user exists', async () => {
    userRepository.findByEmail.mockResolvedValue({ user_id: '1', name: 'John', email: 'a@b.com' });
    userRepository.update.mockResolvedValue();

    const result = await operation.execute('a@b.com');

    expect(tokenService.generateTempToken).toHaveBeenCalledWith({ email: 'a@b.com' }, '1h');
    expect(userRepository.update).toHaveBeenCalledWith('1', expect.objectContaining({
      resetPasswordToken: 'reset_token',
      resetPasswordExpires: expect.any(Date),
    }));
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
      email: 'a@b.com',
      name: 'John',
      token: 'reset_token',
    });
    expect(result).toEqual({ message: 'If this email exists, a reset link has been sent.' });
  });
});
