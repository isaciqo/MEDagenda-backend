const ownershipMiddleware = (req, res, next) => {
  if (req.params.user_id !== req.user.user_id) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }
  next();
};

module.exports = ownershipMiddleware;
