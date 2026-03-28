const errorHandler = (err, req, res, next) => {
  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details ? err.details.map(d => d.message) : [err.message],
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized', message: err.message });
  }

  console.error('[Error]', err);
  return res.status(500).json({ error: 'Internal Server Error', message: err.message });
};

module.exports = errorHandler;
