// Simple custom error class so controllers can throw errors with a clean HTTP status
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
