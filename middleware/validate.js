const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after express-validator check(...) middlewares; collects errors into a clean 400 response
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((e) => `${e.path}: ${e.msg}`).join(', ');
    return next(new ApiError(400, message));
  }
  next();
};

module.exports = validate;
