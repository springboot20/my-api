import { NextFunction, Request, Response } from 'express';

export function apiResponseHandler(fn: Function) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      let nextCalled = false;
      const result = await fn(req, res, (params: any) => {
        nextCalled = true;
        next(params);
      });

      if (!res.headersSent && !nextCalled) {
        res.status(200);
        return result;
      }
    } catch (error) {
      next(error);
    }
  };
}

export class ApiResponse {
  public statusCode: number;
  public data: any;
  public message: string;
  private success: boolean;

  constructor(statusCode: number, data: any, message: string) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
