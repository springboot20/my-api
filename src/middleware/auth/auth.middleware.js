import { validateToken } from "../../utils/jwt.js";
import { apiResponseHandler } from "../api/api.response.middleware.js";
import { UserModel } from "../../models/index.js";
import { CustomErrors } from "../custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";

export const verifyJWT = apiResponseHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ??
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new CustomErrors("verifyJWT Invalid", StatusCodes.UNAUTHORIZED);
  }

  try {
    let decodedToken = validateToken(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await UserModel.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    if (!user) {
      throw new CustomErrors(
        "Invalid Token provided",
        StatusCodes.UNAUTHORIZED,
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
    throw new CustomErrors("verifyJWT Invalid", StatusCodes.UNAUTHORIZED);
  }
});
