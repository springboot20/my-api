import { validateToken } from '@utils/jwt';
import { apiResponseHandler } from '../api/api.response.middleware';
import { UserModel } from '@models/index';
import { UnAuthorized } from '../custom/custom.errors';

export const verifyJWT = apiResponseHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) throw new UnAuthorized('unauthorized request');

  try {
    const decodedToken = validateToken(token);
    const user = await UserModel.findById(decodedToken?._id).select(
      '-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry'
    );

    if (!user) throw new UnAuthorized('Invalid access token');

    req.user = user;
  } catch (error) {
    throw new UnAuthorized(error?.message || 'Invalid access token');
  }
});
