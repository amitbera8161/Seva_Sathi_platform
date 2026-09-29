const jwt = require('jsonwebtoken');

const { User } = require('../models/user.model');
const { ApiError } = require('../utils/apierror');
const { asyncHandler } = require('../utils/asynchandler');
const config = require('../config/env');

// Verifies the access token sent in the Authorization header
// (format: "Bearer <token>") and attaches { id, sessionId } to req.user.
const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    throw new ApiError(401, 'Access token not found');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Access token expired');
    }
    throw new ApiError(401, 'Invalid access token');
  }

  // Confirm the user still exists and hasn't been deactivated since
  // the token was issued — a valid signature alone isn't enough.
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or account deactivated');
  }

  req.user = {
    id: decoded.id,
    sessionId: decoded.sessionId,
    roles: user.roles,
  };

  next();
});

// Restricts a route to users holding at least one of the given roles.
// Usage: router.post('/verify', requireAuth, requireRole('admin'), ...)
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const hasRole = req.user.roles?.some((role) => allowedRoles.includes(role));
  if (!hasRole) {
    throw new ApiError(403, 'You do not have permission to perform this action');
  }

  next();
};

// Does NOT throw if no token is present — attaches req.user only if a
// valid token exists. Useful for routes that behave differently for
// logged-in vs anonymous users (e.g. public NGO listing with extra
// fields for the owning user).
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      req.user = { id: decoded.id, sessionId: decoded.sessionId, roles: user.roles };
    }
  } catch {
    // Invalid/expired token on an optional route — proceed as anonymous
  }

  next();
});

module.exports = { requireAuth, requireRole, optionalAuth };