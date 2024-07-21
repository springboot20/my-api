export class CustomErrors extends Error {
  /**
   *
   * @param {string} message
   * @param {any[]} errors
   * @param {string} stack
   */

  public message: string;
  public errors?: any[];
  public stack?: string | undefined;
  private data?: null;
  public statusCode: number;

  constructor(message: string, statusCode: number, errors?: any[], stack?: string) {
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
