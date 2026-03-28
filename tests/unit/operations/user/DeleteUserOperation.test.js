const DeleteUserOperation = require('../../../../src/app/operations/user/DeleteUserOperation');

describe('DeleteUserOperation', () => {
  let operation;
  let userRepository;

  beforeEach(() => {
    userRepository = { findById: jest.fn(), delete: jest.fn() };
    operation = new DeleteUserOperation({ userRepository });
  });

  it('should throw "User not found" when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(operation.execute('999')).rejects.toThrow('User not found');
  });

  it('should delete user and return success message', async () => {
    userRepository.findById.mockResolvedValue({ user_id: '1' });
    userRepository.delete.mockResolvedValue();

    const result = await operation.execute('1');

    expect(userRepository.delete).toHaveBeenCalledWith('1');
    expect(result).toEqual({ message: 'User deleted successfully' });
  });
});
