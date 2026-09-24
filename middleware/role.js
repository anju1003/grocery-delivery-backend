const ApiError = require('../utils/ApiError');

// Module 13: Role-Based Access Control
// Usage: authorize('admin', 'storeStaff')
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authorized'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, `Role '${req.user.role}' is not permitted to perform this action`));
    }
    next();
  };
};

module.exports = { authorize };
