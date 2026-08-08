const jwt = require('jsonwebtoken');
const logger = require('../../../lib/logger');
const requestContext = require('../../../lib/requestContext');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    logger.error('JWT_ACCESS_SECRET não configurado');
    return res.status(500).json({ message: 'Erro de configuração do servidor' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    // name: 'TokenExpiredError' | 'JsonWebTokenError' — não loga o token em si.
    logger.warn('auth: token inválido ou expirado', { path: req.path, reason: err.name });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const container = require('../container');
    const userRepository = container.resolve('userRepository');
    const user = await userRepository.findById(decoded.user_id);
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      logger.warn('auth: token revogado (tokenVersion não bate)', {
        path: req.path,
        user_id: decoded.user_id,
      });
      return res.status(401).json({ message: 'Token revogado. Faça login novamente.' });
    }
  } catch (err) {
    logger.error('Erro ao verificar tokenVersion', { error: err.message, user_id: decoded.user_id });
    return res.status(500).json({ message: 'Erro interno de autenticação' });
  }

  req.user = decoded;
  requestContext.setUser({ user_id: decoded.user_id, email: decoded.email, role: decoded.role });
  next();
};

module.exports = authMiddleware;
