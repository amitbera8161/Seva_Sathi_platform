// Wraps an async route handler so any thrown error (including ApiError)
// is forwarded to Express's error-handling middleware instead of crashing
// the process or requiring try/catch in every single controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };