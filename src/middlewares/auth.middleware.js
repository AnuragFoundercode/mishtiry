const jwt = require('jsonwebtoken');
const Vendor = require('../models/vendor.model');
const { error } = require('../helpers/response.helper');
require('dotenv').config();

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return error(res, 'Unauthorized', 401);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);

    // Attach vendorId for vendor role routes
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ where: { user_id: req.user.id }, attributes: ['id', 'kyc_status', 'is_approved', 'is_suspended'] });
      if (vendor) {
        req.user.vendorId = vendor.id;
        req.user.kyc_status = vendor.kyc_status;
        req.user.is_approved = vendor.is_approved;
        req.user.is_suspended = vendor.is_suspended;
      }
    }

    next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return error(res, 'Forbidden', 403);
  next();
};

// Blocks suspended vendors or those with unapproved KYC from sensitive actions
const requireApprovedVendor = (req, res, next) => {
  if (req.user.is_suspended) return error(res, 'Your account is suspended', 403);
  if (!req.user.is_approved) return error(res, 'Your account is pending admin approval', 403);
  if (req.user.kyc_status !== 'approved') return error(res, `KYC is ${req.user.kyc_status}. Cannot perform this action`, 403);
  next();
};

module.exports = { authenticate, authorize, requireApprovedVendor };
