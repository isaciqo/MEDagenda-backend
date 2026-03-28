jest.mock('../../../src/interfaces/http/presentation/user/userRoutes', () => [
  {
    method: 'get',
    path: '/test',
    handler: 'testController.testMethod',
    middlewares: [],
    validation: null,
  },
]);
jest.mock('../../../src/interfaces/http/presentation/example/exampleRoutes', () => []);

const routerRegister = require('../../../src/interfaces/http/presentation/RouterRegister');

describe('RouterRegister', () => {
  it('should register routes on the app with correct method and path', () => {
    const mockHandler = jest.fn();
    const mockController = { testMethod: mockHandler };
    const app = { get: jest.fn(), post: jest.fn() };
    const container = { resolve: jest.fn().mockReturnValue(mockController) };

    routerRegister(app, container);

    expect(container.resolve).toHaveBeenCalledWith('testController');
    expect(app.get).toHaveBeenCalledWith(
      '/api/v1/test',
      expect.any(Function), // validationMiddleware
      expect.any(Function), // handler wrapper
    );
  });

  it('should spread middlewares array before validation', () => {
    const mockController = { testMethod: jest.fn() };
    const app = { get: jest.fn() };
    const container = { resolve: jest.fn().mockReturnValue(mockController) };

    routerRegister(app, container);

    const callArgs = app.get.mock.calls[0];
    // path, ...middlewares(0), validate, handler
    expect(callArgs[0]).toBe('/api/v1/test');
  });

  it('the route handler should catch async errors and call next', async () => {
    const error = new Error('async error');
    const mockController = { testMethod: jest.fn().mockRejectedValue(error) };
    const app = { get: jest.fn() };
    const container = { resolve: jest.fn().mockReturnValue(mockController) };

    routerRegister(app, container);

    const next = jest.fn();
    const req = {};
    const res = {};
    // Get the last argument registered (the route handler wrapper)
    const callArgs = app.get.mock.calls[0];
    const routeHandler = callArgs[callArgs.length - 1];

    await routeHandler(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
