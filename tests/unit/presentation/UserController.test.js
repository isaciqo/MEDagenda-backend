const UserController = require('../../../src/interfaces/http/presentation/user/UserController');

describe('UserController', () => {
  let controller;
  let operations;
  let req, res;

  beforeEach(() => {
    operations = {
      createUserOperation: { execute: jest.fn() },
      loginOperation: { execute: jest.fn() },
      getUserOperation: { execute: jest.fn() },
      updateUserOperation: { execute: jest.fn() },
      deleteUserOperation: { execute: jest.fn() },
      changePasswordOperation: { execute: jest.fn() },
      emailConfirmationOperation: { execute: jest.fn() },
      requestPasswordResetOperation: { execute: jest.fn() },
      confirmPasswordResetOperation: { execute: jest.fn() },
    };
    controller = new UserController(operations);
    req = { body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('createUser should call operation and return 201', async () => {
    req.body = { name: 'John', email: 'a@b.com', password: 'pass' };
    operations.createUserOperation.execute.mockResolvedValue({ message: 'created' });
    await controller.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'created' });
  });

  it('login should call operation and return 200', async () => {
    req.body = { email: 'a@b.com', password: 'pass' };
    operations.loginOperation.execute.mockResolvedValue({ token: 'jwt' });
    await controller.login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: 'jwt' });
  });

  it('confirmEmail should call operation and return 200', async () => {
    req.params = { token: 'abc' };
    operations.emailConfirmationOperation.execute.mockResolvedValue({ message: 'confirmed' });
    await controller.confirmEmail(req, res);
    expect(operations.emailConfirmationOperation.execute).toHaveBeenCalledWith('abc');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('requestPasswordReset should call operation and return 200', async () => {
    req.body = { email: 'a@b.com' };
    operations.requestPasswordResetOperation.execute.mockResolvedValue({ message: 'sent' });
    await controller.requestPasswordReset(req, res);
    expect(operations.requestPasswordResetOperation.execute).toHaveBeenCalledWith('a@b.com');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('confirmPasswordReset should call operation and return 200', async () => {
    req.body = { token: 'tok', newPassword: 'new' };
    operations.confirmPasswordResetOperation.execute.mockResolvedValue({ message: 'reset' });
    await controller.confirmPasswordReset(req, res);
    expect(operations.confirmPasswordResetOperation.execute).toHaveBeenCalledWith({ token: 'tok', newPassword: 'new' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getUser should call operation and return 200', async () => {
    req.params = { user_id: '1' };
    operations.getUserOperation.execute.mockResolvedValue({ user_id: '1' });
    await controller.getUser(req, res);
    expect(operations.getUserOperation.execute).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateUser should call operation and return 200', async () => {
    req.params = { user_id: '1' };
    req.body = { name: 'New' };
    operations.updateUserOperation.execute.mockResolvedValue({ user_id: '1', name: 'New' });
    await controller.updateUser(req, res);
    expect(operations.updateUserOperation.execute).toHaveBeenCalledWith('1', { name: 'New' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('changePassword should call operation with merged params and body, return 200', async () => {
    req.params = { user_id: '1' };
    req.body = { currentPassword: 'old', newPassword: 'new' };
    operations.changePasswordOperation.execute.mockResolvedValue({ message: 'changed' });
    await controller.changePassword(req, res);
    expect(operations.changePasswordOperation.execute).toHaveBeenCalledWith({
      user_id: '1',
      currentPassword: 'old',
      newPassword: 'new',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteUser should call operation and return 200', async () => {
    req.params = { user_id: '1' };
    operations.deleteUserOperation.execute.mockResolvedValue({ message: 'deleted' });
    await controller.deleteUser(req, res);
    expect(operations.deleteUserOperation.execute).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
