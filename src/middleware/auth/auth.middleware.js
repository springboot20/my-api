import { validateToken } from '../../utils/jwt.js';
import { apiResponseHandler } from '../api/api.response.middleware.js';
import { UserModel } from '../../models/index.js';
import { CustomErrors } from '../custom/custom.errors.js';
import { StatusCodes } from 'http-status-codes';

export const verifyJWT = apiResponseHandler(
  async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) throw new CustomErrors('unauthorized request', StatusCodes.UNAUTHORIZED);

    try {
      const decodedToken = validateToken(token)

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
