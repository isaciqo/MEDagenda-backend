const UpdateUserOperation = require('../../../../src/app/operations/user/UpdateUserOperation');

describe('UpdateUserOperation', () => {
  let operation;
  let userRepository;

  beforeEach(() => {
    userRepository = { findById: jest.fn(), update: jest.fn() };
    operation = new UpdateUserOperation({ userRepository });
  });

  it('should throw "User not found" when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(operation.execute('999', { name: 'New' })).rejects.toThrow('User not found');
  });

  it('should update and return user without sensitive fields', async () => {
    userRepository.findById.mockResolvedValue({ user_id: '1' });
    const updatedUser = {
      toObject: () => ({
        user_id: '1',
        name: 'New Name',
        password: 'hash',
        resetPasswordToken: null,
        resetPasswordExpires: null,
      }),
    };
    userRepository.update.mockResolvedValue(updatedUser);

    const result = await operation.execute('1', { name: 'New Name' });

    expect(userRepository.update).toHaveBeenCalledWith('1', { name: 'New Name' });
    expect(result).not.toHaveProperty('password');
    expect(result).toHaveProperty('name', 'New Name');
  });
});
