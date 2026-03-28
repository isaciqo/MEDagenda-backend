const ConfirmPasswordResetOperation = require('../../../../src/app/operations/user/ConfirmPasswordResetOperation');

describe('ConfirmPasswordResetOperation', () => {
  let operation;
  let userRepository, tokenService, hashPasswordService;

  beforeEach(() => {
    userRepository = { findByResetToken: jest.fn(), update: jest.fn() };
    tokenService = { verify: jest.fn() };
    hashPasswordService = { hash: jest.fn().mockResolvedValue('new_hashed') };
    operation = new ConfirmPasswordResetOperation({ userRepository, tokenService, hashPasswordService });
  });

  it('should throw when token is invalid', async () => {
    tokenService.verify.mockImplementation(() => { throw new Error('expired'); });
    await expect(operation.execute({ token: 'bad', newPassword: 'new' }))
      .rejects.toThrow('Invalid or expired reset token');
  });

  it('should throw when no user found for token', async () => {
    tokenService.verify.mockReturnValue({ email: 'a@b.com' });
    userRepository.findByResetToken.mockResolvedValue(null);
    await expect(operation.execute({ token: 'valid', newPassword: 'new' }))
      .rejects.toThrow('Invalid or expired reset token');
  });

  it('should update password and clear reset token on success', async () => {
    tokenService.verify.mockReturnValue({ email: 'a@b.com' });
    userRepository.findByResetToken.mockResolvedValue({ user_id: '1' });
    userRepository.update.mockResolvedValue();

    const result = await operation.execute({ token: 'valid', newPassword: 'newpass' });

    expect(hashPasswordService.hash).toHaveBeenCalledWith('newpass');
    expect(userRepository.update).toHaveBeenCalledWith('1', {
      password: 'new_hashed',
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
    expect(result).toEqual({ message: 'Password reset successfully' });
  });
});
