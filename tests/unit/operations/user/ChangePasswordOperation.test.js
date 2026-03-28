const ChangePasswordOperation = require('../../../../src/app/operations/user/ChangePasswordOperation');

describe('ChangePasswordOperation', () => {
  let operation;
  let userRepository, hashPasswordService;

  beforeEach(() => {
    userRepository = { findById: jest.fn(), update: jest.fn() };
    hashPasswordService = { compare: jest.fn(), hash: jest.fn() };
    operation = new ChangePasswordOperation({ userRepository, hashPasswordService });
  });

  it('should throw "User not found" when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(operation.execute({ user_id: '999', currentPassword: 'old', newPassword: 'new' }))
      .rejects.toThrow('User not found');
  });

  it('should throw "Current password is incorrect" when password does not match', async () => {
    userRepository.findById.mockResolvedValue({ user_id: '1', password: 'hashed' });
    hashPasswordService.compare.mockResolvedValue(false);
    await expect(operation.execute({ user_id: '1', currentPassword: 'wrong', newPassword: 'new' }))
      .rejects.toThrow('Current password is incorrect');
  });

  it('should update password and return success message', async () => {
    userRepository.findById.mockResolvedValue({ user_id: '1', password: 'hashed' });
    hashPasswordService.compare.mockResolvedValue(true);
    hashPasswordService.hash.mockResolvedValue('new_hashed');
    userRepository.update.mockResolvedValue();

    const result = await operation.execute({ user_id: '1', currentPassword: 'old', newPassword: 'new' });

    expect(userRepository.update).toHaveBeenCalledWith('1', { password: 'new_hashed' });
    expect(result).toEqual({ message: 'Password changed successfully' });
  });
});
