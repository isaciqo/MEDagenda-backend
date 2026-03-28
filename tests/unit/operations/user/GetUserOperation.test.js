const GetUserOperation = require('../../../../src/app/operations/user/GetUserOperation');

describe('GetUserOperation', () => {
  let operation;
  let userRepository;

  beforeEach(() => {
    userRepository = { findById: jest.fn() };
    operation = new GetUserOperation({ userRepository });
  });

  it('should throw "User not found" when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(operation.execute('999')).rejects.toThrow('User not found');
  });

  it('should return user without sensitive fields', async () => {
    const mockUser = {
      toObject: () => ({
        user_id: '1',
        name: 'John',
        email: 'a@b.com',
        password: 'secret',
        resetPasswordToken: 'token',
        resetPasswordExpires: new Date(),
        role: 'user',
      }),
    };
    userRepository.findById.mockResolvedValue(mockUser);

    const result = await operation.execute('1');

    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('resetPasswordToken');
    expect(result).not.toHaveProperty('resetPasswordExpires');
    expect(result).toHaveProperty('user_id', '1');
    expect(result).toHaveProperty('name', 'John');
  });
});
