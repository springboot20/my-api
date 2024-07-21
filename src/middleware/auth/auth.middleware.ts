import { validateToken } from '@utils/jwt';
import { apiResponseHandler } from '../api/api.response.middleware';
import { UserModel } from '@models/index';
import { CustomErrors } from '../custom/custom.errors';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';

export const verifyJWT = apiResponseHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) throw new CustomErrors('unauthorized request', StatusCodes.UNAUTHORIZED);

    try {
      const decodedToken = validateToken(token) as JwtPayload;

      const user = await UserModel.findById(decodedToken?._id).select(
        '-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry'
      );

      if (!user) throw new CustomErrors('Invalid access token', StatusCodes.UNAUTHORIZED);

      req.user = user;
    } catch (error) {
      if (error instanceof Error) {
        throw new CustomErrors(error?.message || 'Invalid access token', StatusCodes.UNAUTHORIZED);
      }
    }
  }
);
