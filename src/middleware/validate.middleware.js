import { validationResult } from 'express-validator'
import { CustomErrors } from './custom/custom.errors.js'; 
import { StatusCodes } from 'http-status-codes'

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validate = (req, res, next) => {
  const validationErrors = validationResult(req);

  if (validationErrors.isEmpty()) {
    return next();
  } else {
    
    let extractedError = [];
    validationErrors.array().map((error) => extractedError.push({ [error.path]: error.msg }));

    throw new CustomErrors(
      StatusCodes.UNPROCESSABLE_ENTITY,
      'Received data is not valid',
      extractedError
    );
  }
};

export { validate };
