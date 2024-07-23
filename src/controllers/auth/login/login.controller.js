import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { mongooseTransactions } from "../../../middleware/mongoose/mongoose.transactions.js";
import { UserModel } from "../../../models/index.js";
import {
  generateAccessToken,
  generateRefreshToken
} from "../../../utils/jwt.js";
import { StatusCodes } from "http-status-codes";

export const generateTokens = async (userId) => {
  try {
    // find user with the id generated for a user when they create an account
    const user = await UserModel.findById(userId);

    // check if the user is not found in the database
    if (!user)
      throw new CustomErrors(
        "user does not exist in the database",
        StatusCodes.NOT_FOUND
      );

    let accessPayload = {
      _id: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
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

export const login = apiResponseHandler(
  mongooseTransactions(async (req, res) => {
    const { username, email, password } = req.body;

    const user = await UserModel.findOne({ $or: [{ email }, { username }] });

    if (!user)
      throw new CustomErrors("user does not exists", StatusCodes.NOT_FOUND);
    if (!(email && password))
      throw new CustomErrors(
        "please provide an email and a password",
        StatusCodes.BAD_REQUEST
      );

    if (!(await user.matchPasswords(password)))
      throw new CustomErrors(
        "invalid password entered",
        StatusCodes.UNAUTHORIZED
      );

    const { accessToken, refreshToken } = await generateTokens(user?._id);

    const loggedInUser = await UserModel.findById(user._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    return new ApiResponse(
      StatusCodes.OK,
      {
        user: loggedInUser,
        tokens: { accessToken, refreshToken },
      },
      "user logged in successfully"
    );
  })
);
