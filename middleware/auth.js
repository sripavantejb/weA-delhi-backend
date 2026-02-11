const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { error } = require('../views/response');

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return error(res, 'Unauthorized', 401);
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return error(res, 'User not found', 401);
    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
}

module.exports = { auth };
