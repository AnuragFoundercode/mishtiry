const jwt = require('jsonwebtoken');
const { error } = require('../helpers/response.helper');
require('dotenv').config();

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return error(res, 'Unauthorized', 401);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
};

const authorize = (...roles) => (req, res, next) => {
  // vendor can access vendor + admin routes (vendor IS the admin in single-vendor mode)
  const effectiveRoles = req.user.role === 'vendor' ? [...roles, 'vendor'] : roles;
  if (!effectiveRoles.includes(req.user.role)) return error(res, 'Forbidden', 403);
  next();
};

// Kept for backward compat — in single vendor mode vendor is always approved
const requireApprovedVendor = (req, res, next) => next();

module.exports = { authenticate, authorize, requireApprovedVendor };
