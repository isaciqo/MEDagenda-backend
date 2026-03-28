const Joi = require('joi');
const validationMiddleware = require('../../../src/interfaces/http/middlewares/validationMiddleware');

describe('validationMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {};
    next = jest.fn();
  });

  it('should call next immediately when no validation is provided', () => {
    const middleware = validationMiddleware(undefined);
    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with no error for valid input', () => {
    const schema = Joi.object({ name: Joi.string().required() });
    req.body = { name: 'John' };
    const middleware = validationMiddleware({ body: schema });
    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with error for invalid input', () => {
    const schema = Joi.object({ name: Joi.string().required() });
    req.body = {};
    const middleware = validationMiddleware({ body: schema });
    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should mutate req with validated and stripped values', () => {
    const schema = Joi.object({ name: Joi.string().required() });
    req.body = { name: 'John', extra: 'stripped' };
    const middleware = validationMiddleware({ body: schema });
    middleware(req, res, next);
    expect(req.body).toEqual({ name: 'John' });
  });

  it('should validate multiple locations (body and params)', () => {
    const bodySchema = Joi.object({ title: Joi.string().required() });
    const paramsSchema = Joi.object({ id: Joi.string().required() });
    req.body = { title: 'Test' };
    req.params = { id: '123' };
    const middleware = validationMiddleware({ body: bodySchema, params: paramsSchema });
    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });
});
