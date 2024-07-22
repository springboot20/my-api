import crypto from "crypto";
import {
  ApiResponse,
  apiResponseHandler,
} from "../../../middleware/api/api.response.middleware.js";
import { mongooseTransactions } from "../../../middleware/mongoose/mongoose.transactions.js";
import { UserModel } from "../../../models/index.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import {
  generateTemporaryTokens,
  matchPasswords,
  validateToken,
} from "../../../utils/jwt.js";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { generateTokens } from "../login/login.controller.js";
import { JwtPayload } from "jsonwebtoken";

export const resetPassword = apiResponseHandler(
  mongooseTransactions(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    if (!resetToken)
      throw new CustomErrors(
        "Reset password token is missing",
        StatusCodes.BAD_REQUEST
      );

    let hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await UserModel.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user)
      throw new CustomErrors(
        "Token is invalid or expired",
        StatusCodes.UNAUTHORIZED
      );

    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return new ApiResponse(StatusCodes.OK, {}, "Password reset successfully");
  })
);

export const changeCurrentPassword = apiResponseHandler(
  mongooseTransactions(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await UserModel.findById(req.user?._id);

    if (!(await matchPasswords(oldPassword, user.password)))
      throw new CustomErrors("Invalid old password", StatusCodes.BAD_REQUEST);

    user.password = newPassword;
    use.save({ validateBeforeSave: false });

    return {
      message: "Password changed successfully",
    };
  })
);

export const forgotPassword = apiResponseHandler(
  mongooseTransactions(async (req, res, session) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) throw new CustomErrors("User not found", StatusCodes.NOT_FOUND);

    const { unHashedToken, hashedToken, tokenExpiry } =
      await generateTemporaryTokens();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordTokenExpiry = new Date(tokenExpiry);
    await user.save({ validateBeforeSave: false });

    const resetLink = `${req.protocol}//:${req.get(
      "host"
    )}/api/v1/user/reset-password/${unHashedToken}`;
    // await sendMail(user.email, 'Password reset', { resetLink, username: user.username }, 'reset-password');

    await user.save({ validateBeforeSave: false, session });
    return { message: "Password reset link sent to your email" };
  })
);

export const refreshToken = apiResponseHandler(
  mongooseTransactions(async (req, res, session) => {
    const {
      body: { inComingRefreshToken },
    } = req;

    try {
      const decodedRefreshToken = validateToken(inComingRefreshToken);
      let user = await UserModel.findByIdAndUpdate(decodedRefreshToken?._id);

      if (!user) {
        throw new CustomErrors("Invalid Token", StatusCodes.UNAUTHORIZED);
      }

      if (inComingRefreshToken !== user?.refreshToken) {
        throw new CustomErrors(
          "Token has expired or has already been used",
          StatusCodes.UNAUTHORIZED
        );
      }

      const { accessToken, refreshToken } = await generateTokens(user?._id);

      user.refreshToken = refreshToken;
      await user.save({ session });

      return {
        message: "access token refreshed successfully",
        tokens: { accessToken, refreshToken },
      };
    } catch (error) {
      return new CustomErrors(`Error : ${error}`, StatusCodes.UNAUTHORIZED);
    }
  })
);

export const verifyEmail = apiResponseHandler(
  mongooseTransactions(async (req, res) => {
    const { verificationToken } = req.params;

    if (!verificationToken)
      throw new CustomErrors(
        "Email verification token is missing",
        StatusCodes.BAD_REQUEST
      );

    let hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await UserModel.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user)
      throw new CustomErrors(
        "Token is invalid or expired",
        StatusCodes.UNAUTHORIZED
      );

    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;

    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return { message: "Email is verified", isEmailVerified: true };
  })
);

export const resendEmailVerification = apiResponseHandler(
  mongooseTransactions(async (req, res, session) => {
    const user = await UserModel.findById(req.user?._id);

    if (!user) throw new CustomErrors("User not found", StatusCodes.NOT_FOUND);
    if (user.isEmailVerified)
      throw new CustomErrors(
        "Email has already been verified",
        StatusCodes.CONFLICT
      );

    const { unHashedToken, hashedToken, tokenExpiry } =
      await generateTemporaryTokens();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = new Date(tokenExpiry);
    await user.save({ validateBeforeSave: false });

    const verifyLink = `${req.protocol}//:${req.get(
      "host"
    )}/api/v1/users/verify-email/${unHashedToken}`;
    // await sendMail(user.email, 'Password reset', { verifyLink, username: user.username }, 'verify-email');

    await user.save({ validateBeforeSave: false, session });
    return { message: "email verification link sent to your email" };
  })
);
