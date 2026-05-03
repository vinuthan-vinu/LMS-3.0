/**
 * Optionally attach req.user when a valid Bearer token is present.
 * Does not block the request when the token is missing or invalid (for public reads).
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, _res, next) => {
  req.user = null;
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next();
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    /* ignore invalid/expired tokens for optional routes */
  }
  next();
};
