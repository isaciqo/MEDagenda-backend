const LoginOperation = require('../../../../src/app/operations/user/LoginOperation');

describe('LoginOperation', () => {
  let operation;
  let validateLoginService, tokenService;

  beforeEach(() => {
    validateLoginService = { validate: jest.fn() };
    tokenService = { generate: jest.fn().mockReturnValue('jwt_token') };
    operation = new LoginOperation({ validateLoginService, tokenService });
  });

  it('should return token and user info on successful login', async () => {
    const mockUser = { user_id: '1', name: 'John', email: 'a@b.com', role: 'user' };
    validateLoginService.validate.mockResolvedValue(mockUser);

    const result = await operation.execute({ email: 'a@b.com', password: 'pass' });

    expect(validateLoginService.validate).toHaveBeenCalledWith('a@b.com', 'pass');
    expect(tokenService.generate).toHaveBeenCalledWith({ user_id: '1', email: 'a@b.com', role: 'user' });
    expect(result).toEqual({
      token: 'jwt_token',
      user: { user_id: '1', name: 'John', email: 'a@b.com', role: 'user' },
    });
  });

  it('should propagate errors from validateLoginService', async () => {
    validateLoginService.validate.mockRejectedValue(new Error('Invalid credentials'));
    await expect(operation.execute({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow('Invalid credentials');
  });
});
