import { StatusCodes } from 'http-status-codes';

const notFoundError = (req, res, next) => {
  res.status(StatusCodes.NOT_FOUND).json({ message: 'Route not found' });
};

const handleError = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message ?? 'Something went wrong',
    stack:err.stack ?? []
  };

  if (err.name === 'ValidationError') {
    customError.message = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');
    customError.statusCode = StatusCodes.BAD_REQUEST;// Use 400 for validation errors

    console.log(Object.values(err.errors))
  }

  if (err.code && err.code === 11000) { // Check for duplicate key error
    customError.message = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
    customError.statusCode = StatusCodes.BAD_REQUEST; // Use 400 for bad request
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    customError.statusCode = StatusCodes.NOT_FOUND; // Use 404 for not found
    customError.message = 'Resource not found';
  }

  // Ensure the status code is a valid HTTP status code
  if (customError.statusCode < 100 || customError.statusCode > 599) {
    console.error(`Invalid status code: ${customError.statusCode}`);
    customError.statusCode = StatusCodes.INTERNAL_SERVER_ERROR; // Default to 500 if invalid status code is detected
  }
  
  res.status(customError.statusCode).json(customError);
};

export { handleError, notFoundError };