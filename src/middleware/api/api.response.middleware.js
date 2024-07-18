/** @format */

export function apiResponseHandler(fn) {
  return async function (req, res, next) {
    try {
      let nextCalled = false;
      const result = await fn(req, res, (params) => {
        nextCalled = true;
        next(params);
      });

      if (!res.headersSent && !nextCalled) {
        res.json(result);
      }
    } catch (error) {
      next(error);
    }
  };
}

