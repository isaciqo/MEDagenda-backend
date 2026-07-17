const logger = require('../../../lib/logger');

const SENSITIVE_FIELDS = ['password', 'currentPassword', 'newPassword', 'token'];

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  const clean = { ...body };
  SENSITIVE_FIELDS.forEach(field => {
    if (clean[field] !== undefined) clean[field] = '[REDACTED]';
  });
  return clean;
}

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const route = `${req.method} ${req.originalUrl}`;
  const stackMeta = { stack: err.stack };

  if (err.isJoi || err.name === 'ValidationError') {
    const details = err.details?.map(d => d.message) ?? [err.message];
    logger.warn(`Validation error — ${route}`, { details: details.join('; ') });
    return res.status(400).json({ error: 'Validation Error', details });
  }

  if (err.name === 'UnauthorizedError') {
    logger.warn(`Unauthorized — ${route}`);
    return res.status(401).json({ error: 'Unauthorized', message: err.message });
  }

  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    logger.warn(`${err.message} — ${route}`);
    return res.status(err.statusCode).json({ error: 'Bad Request', message: err.message });
  }

  if (err.status && err.status >= 400 && err.status < 500) {
    logger.warn(`${err.message} — ${route}`);
    return res.status(err.status).json({ error: 'Bad Request', message: err.message });
  }

  logger.error(`Internal Server Error — ${route}`, stackMeta);
  return res.status(500).json({ error: 'Internal Server Error' });
};

module.exports = errorHandler;
