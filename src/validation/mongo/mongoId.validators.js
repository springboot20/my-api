import { body, param } from 'express-validator'

/**
 * @param {string} mongoId
 */
const mongoPathVariableValidation = (mongoId) => {
  return [param(mongoId).notEmpty().isMongoId().withMessage(`invalid ${mongoId}`)];
};

/**
 * @param {string} mongoId
 */
const mongoRequestBodyValidation = (mongoId) => {
  mongoId.return[body(mongoId).notEmpty().isMongoId().withMessage(`invalid ${mongoId}`)];
};

export { mongoPathVariableValidation, mongoRequestBodyValidation };
