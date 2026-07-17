const logger = require('../../../lib/logger');

const SKIP_PATHS = ['/api-docs', '/favicon.ico'];

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    if (SKIP_PATHS.some(p => req.path.startsWith(p))) return;

    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](`${req.method} ${req.path} ${res.statusCode}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
      ip: req.ip,
      user_id: req.user?.user_id ?? null,
    });
  });

  next();
}

module.exports = requestLogger;
