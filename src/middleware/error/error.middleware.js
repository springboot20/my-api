import { StatusCodes } from 'http-status-codes';
import { CustomErrors } from '../custom/custom.errors.js';

const notFoundError = (req, res, next) => {
  res.status(StatusCodes.NOT_FOUND).json({ message: 'Route not found' });
};

const handleError = (err, req, res, next) => {
  if (!(err instanceof CustomErrors)) {
    const customError = {
      statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      message: err.message || 'something went wrong',
    };

    err = new CustomErrors(customError.message, customError.statusCode);
  }

  if (err.name === 'ValidationError') {
    err.message = Object.values(err.errors)
      .map((item) => item.message)
      .join(',');
    err.statusCode = 404;
  }

  if (err.code && err.code === 11000) {
    err.message = `duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
    err.statusCode = 400;
  }

  if (err.name === 'CastError') {
    err.statusCode = 404;
    err.message = `No item found with id:${err.value}`;
  }
  console.log(err.message);
  return res.status(err.statusCode).json({ message: err.message });
};

export { handleError, notFoundError };
