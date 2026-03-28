const CreateUserOperation = require('../../../../src/app/operations/user/CreateUserOperation');

jest.mock('uuid', () => ({ v4: () => 'mocked-uuid' }));

describe('CreateUserOperation', () => {
  let operation;
  let userRepository, hashPasswordService, tokenService, emailService;

  beforeEach(() => {
    userRepository = { findByEmail: jest.fn(), create: jest.fn() };
    hashPasswordService = { hash: jest.fn().mockResolvedValue('hashed_password') };
    tokenService = { generateTempToken: jest.fn().mockReturnValue('confirm_token') };
    emailService = { sendConfirmationEmail: jest.fn().mockResolvedValue() };
    operation = new CreateUserOperation({ userRepository, hashPasswordService, tokenService, emailService });
  });

  it('should throw "Email already in use" if email exists', async () => {
    userRepository.findByEmail.mockResolvedValue({ email: 'a@b.com' });
    await expect(operation.execute({ name: 'John', email: 'a@b.com', password: 'pass' }))
      .rejects.toThrow('Email already in use');
  });

  it('should create a user and send confirmation email on success', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue({ user_id: 'mocked-uuid', email: 'a@b.com' });

    const result = await operation.execute({ name: 'John', email: 'a@b.com', password: 'pass' });

    expect(hashPasswordService.hash).toHaveBeenCalledWith('pass');
    expect(userRepository.create).toHaveBeenCalledWith({
      user_id: 'mocked-uuid',
      name: 'John',
      email: 'a@b.com',
      password: 'hashed_password',
      isConfirmed: false,
    });
    expect(tokenService.generateTempToken).toHaveBeenCalledWith({ email: 'a@b.com' }, '24h');
    expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith({ email: 'a@b.com', name: 'John', token: 'confirm_token' });
    expect(result).toEqual({ message: 'User created. Please check your email to confirm your account.' });
  });
});
