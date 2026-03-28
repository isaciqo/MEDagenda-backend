const errorHandler = require('../../../src/interfaces/http/middlewares/errorHandler');

describe('errorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should return 400 for Joi validation errors (isJoi = true)', () => {
    const err = { isJoi: true, details: [{ message: 'name is required' }] };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      details: ['name is required'],
    });
  });

  it('should return 400 for errors with name ValidationError', () => {
    const err = { name: 'ValidationError', details: [{ message: 'field invalid' }] };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 with message array when details is missing', () => {
    const err = { isJoi: true, message: 'Validation failed' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      details: ['Validation failed'],
    });
  });

  it('should return 401 for UnauthorizedError', () => {
    const err = { name: 'UnauthorizedError', message: 'No auth' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', message: 'No auth' });
  });

  it('should return 500 for generic errors', () => {
    const err = new Error('Something went wrong');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'Something went wrong',
    });
  });
});
