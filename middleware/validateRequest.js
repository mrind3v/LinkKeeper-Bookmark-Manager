const { validationResult } = require('express-validator');
const { ApiError } = require('./errorMiddleware');

/**
 * Middleware to validate the request using express-validator
 * If there are validation errors, it will throw an ApiError with status 400
 * and the validation errors in the response
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
    }));
    
    throw new ApiError(400, 'Validation failed', true, null, errorMessages);
  }
  
  next();
};

module.exports = {
  validateRequest,
};
