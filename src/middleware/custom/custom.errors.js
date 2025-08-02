export class CustomErrors extends Error {
  /**
   *
   * @param {string} message
   * @param {number} statusCode
   * @param {any[]} errors
   * @param {any} data
   * @param {string} stack
   */

  constructor(message, statusCode, errors = [], data, stack) {
    super(message);

    this.data = data;
    this.errors = errors;
    this.message = message;
    this.statusCode = statusCode;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
