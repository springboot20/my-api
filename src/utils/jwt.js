import jwt from "jsonwebtoken";
import { CustomErrors } from "../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { UserModel } from "../models/index.js";

/**
 *
 * @param {string} userId
 * @returns {Promise<{accessToken: string; refreshToken: string}>}
 */
export const generateTokens = async (userId) => {
  try {
    // find user with the id generated for a user when they create an account
    const user = await UserModel.findById(userId);

    // check if the user is not found in the database
    if (!user) throw new CustomErrors("user does not exist in the database", StatusCodes.NOT_FOUND);

    let accessPayload = {
      _id: user._id,
      username: `${user.firstname} ${user.lastname}`,
      role: user.role,
      email: user.email,
    };

    let refreshPayload = {
      _id: user._id,
    };

    const accessToken = generateAccessToken(accessPayload);
    const refreshToken = generateRefreshToken(refreshPayload);

    user.refreshToken = refreshToken;

    user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    if (error instanceof Error) {
      throw new CustomErrors(
        error.message ?? "something went wrong",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
};

const validateToken = (token, key) => {
  try {
    const decodedToken = jwt.verify(token, key);
    return decodedToken;
  } catch (error) {
    throw new CustomErrors("Token verification failed", StatusCodes.UNAUTHORIZED);
  }
};

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES,
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES,
  });
};

export { validateToken };
