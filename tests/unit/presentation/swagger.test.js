jest.mock('swagger-ui-express', () => ({
  serve: [],
  setup: jest.fn().mockReturnValue((req, res) => res.send('swagger')),
}));

jest.mock('../../../src/interfaces/http/presentation/user/userRoutes', () => [
  {
    method: 'get',
    path: '/users',
    swagger: { tags: ['Users'], summary: 'List users', responses: { 200: { description: 'OK' } } },
  },
  {
    method: 'get',
    path: '/users/:id',
    // no swagger property - should use default
  },
]);

jest.mock('../../../src/interfaces/http/presentation/example/exampleRoutes', () => []);

const setupSwagger = require('../../../src/interfaces/http/presentation/swagger');

describe('setupSwagger', () => {
  it('should register /api-docs and /api-docs.json routes', () => {
    const app = {
      use: jest.fn(),
      get: jest.fn(),
    };

    setupSwagger(app);

    expect(app.use).toHaveBeenCalledWith('/api-docs', expect.anything(), expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/api-docs.json', expect.any(Function));
  });

  it('should respond with the spec on GET /api-docs.json', () => {
    const app = { use: jest.fn(), get: jest.fn() };
    setupSwagger(app);

    const jsonHandler = app.get.mock.calls[0][1];
    const res = { json: jest.fn() };
    jsonHandler({}, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        openapi: '3.0.0',
        paths: expect.objectContaining({
          '/api/v1/users': expect.any(Object),
        }),
      })
    );
  });

  it('should convert :param to {param} in swagger paths', () => {
    const app = { use: jest.fn(), get: jest.fn() };
    setupSwagger(app);

    const jsonHandler = app.get.mock.calls[0][1];
    const res = { json: jest.fn() };
    jsonHandler({}, res);

    const spec = res.json.mock.calls[0][0];
    expect(spec.paths).toHaveProperty('/api/v1/users/{id}');
  });

  it('should use default swagger definition when route has no swagger property', () => {
    const app = { use: jest.fn(), get: jest.fn() };
    setupSwagger(app);

    const jsonHandler = app.get.mock.calls[0][1];
    const res = { json: jest.fn() };
    jsonHandler({}, res);

    const spec = res.json.mock.calls[0][0];
    const defaultEntry = spec.paths['/api/v1/users/{id}']['get'];
    expect(defaultEntry).toHaveProperty('summary');
    expect(defaultEntry).toHaveProperty('responses');
  });
});
