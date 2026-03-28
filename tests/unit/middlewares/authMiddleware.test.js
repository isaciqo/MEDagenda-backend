const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../src/interfaces/http/middlewares/authMiddleware');

describe('authMiddleware', () => {
  const secret = 'test-secret';
  let req, res, next;

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should return 401 when no authorization header is present', () => {
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authorization token required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', () => {
    req.headers.authorization = 'Basic sometoken';
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authorization token required' });
  });

  it('should return 401 when token is invalid', () => {
    req.headers.authorization = 'Bearer invalid.token.here';
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
  });

  it('should set req.user and call next for valid token', () => {
    const token = jwt.sign({ user_id: '1', email: 'a@b.com' }, secret);
    req.headers.authorization = `Bearer ${token}`;
    authMiddleware(req, res, next);
    expect(req.user).toMatchObject({ user_id: '1', email: 'a@b.com' });
    expect(next).toHaveBeenCalled();
  });
});
