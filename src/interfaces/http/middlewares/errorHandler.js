const logger = require('../../../lib/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const meta = {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    ...(err.details && { details: err.details.map(d => d.message) }),
    ...(err.stack && { stack: err.stack }),
  };

  if (err.isJoi || err.name === 'ValidationError') {
    logger.warn('Validation error', { ...meta, details: err.details?.map(d => d.message) ?? [err.message] });
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details ? err.details.map(d => d.message) : [err.message],
    });
  }

  if (err.name === 'UnauthorizedError') {
    logger.warn('Unauthorized', { ...meta, message: err.message });
    return res.status(401).json({ error: 'Unauthorized', message: err.message });
  }

  if (err.status && err.status >= 400 && err.status < 500) {
    logger.warn(err.message, meta);
    return res.status(err.status).json({ error: 'Bad Request', message: err.message });
  }

  logger.error(err.message || 'Internal Server Error', meta);
  return res.status(500).json({ error: 'Internal Server Error', message: err.message });
};

module.exports = errorHandler;
