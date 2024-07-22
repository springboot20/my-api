export class CustomErrors extends Error {
  /**
   *
   * @param {string} message
   * @param {any[]} errors
   * @param {string} stack
   */

  constructor(message, statusCode, errors = [], stack) {
    super(message);

    this.stack = stack;
    this.data = null;
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
