import jwt from "jsonwebtoken";
import { CustomErrors } from "../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";

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
