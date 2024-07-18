import jwt from 'jsonwebtoken';
import { BadRequest, NOTFOUND } from '@middleware/custom/custom.errors';
import { UserModel } from '@models/index';

const validateToken = (token) => {
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    return decodedToken;
  } catch (error) {
    throw new BadRequest('Token verification failed');
  }
};

/**
 *
 * @param {string} userId
 * @returns {accessToken: string, refreshToken: string}
 *
 * A function which generate tokens i.e {accessToken and refreshToken} from the pre-defined function in the mongoose model
 */

export const generateTokens = async (userId) => {
  try {
    // find user with the id generated for a user when they create an account
    const user = await UserModel.findById(userId);

    // check if the user is not found in the database
    if (!user) throw new NOTFOUND('user does not exist in the database');

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
    
  } catch (error) {
    throw error;
  }
};

export { validateToken, generateTokens };
