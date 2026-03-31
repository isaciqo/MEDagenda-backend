const logError = (level, err, req) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    method: req.method,
    url: req.originalUrl,
    status: err.status || (level === 'warn' ? 400 : 500),
    error: err.name || 'Error',
    message: err.message,
    ...(err.details && { details: err.details.map(d => d.message) }),
    ...(level === 'error' && { stack: err.stack }),
  };
  console[level]('[MEDagenda]', JSON.stringify(entry));
};

const errorHandler = (err, req, res, next) => {
  if (err.isJoi || err.name === 'ValidationError') {
    logError('warn', err, req);
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details ? err.details.map(d => d.message) : [err.message],
    });
  }

  if (err.name === 'UnauthorizedError') {
    logError('warn', { ...err, status: 401 }, req);
    return res.status(401).json({ error: 'Unauthorized', message: err.message });
  }

  logError('error', err, req);
  return res.status(500).json({ error: 'Internal Server Error', message: err.message });
};

module.exports = errorHandler;
