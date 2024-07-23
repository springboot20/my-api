import jwt from "jsonwebtoken";
import { CustomErrors } from "../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import bcrypt from "bcrypt";

const validateToken = (token) => {
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    return decodedToken;
  } catch (error) {
    throw new CustomErrors(
      "Token verif.toString(ication failed",
      StatusCodes.BAD_REQUEST
    );
  }
};

export const matchPasswords = async (entered_password, dbPassword) => {
  return await bcrypt.compare(entered_password,dbPassword);
};

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY,
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY,
  });
};

export const generateTemporaryTokens = async () => {
  const unHashedToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  const tokenExpiry = 5 * 60 * 1000;

  return { unHashedToken, hashedToken, tokenExpiry };
};

export { validateToken };
