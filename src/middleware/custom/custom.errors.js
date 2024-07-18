import { StatusCodes } from 'http-status-codes'

class CustomErrors extends Error {
  constructor(message) {
    super(message);
  }
}

class BadRequest extends CustomErrors {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

class NotFound extends CustomErrors {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

class UnAuthorized extends CustomErrors {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

class UnAuthenticated extends CustomErrors {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}


class Conflict extends CustomErrors {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.CONFLICT;
  }
}

export { BadRequest, NotFound, UnAuthorized, UnAuthenticated, Conflict };
