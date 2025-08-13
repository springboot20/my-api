import {
  ApiResponse,
  apiResponseHandler,
} from "../../../middleware/api/api.response.middleware.js";
import { ProfileModel, UserModel } from "../../../models/index.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { validateToken } from "../../../utils/jwt.js";
import { StatusCodes } from "http-status-codes";
import { generateTokens } from "../../../utils/jwt.js"; 
import bcrypt from "bcrypt";
import { sendMail } from "../../../service/email.service.js";

export const resetPassword = apiResponseHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  console.log(resetToken, password);

  if (!resetToken)
    throw new CustomErrors("Reset password token is missing", StatusCodes.BAD_REQUEST);

  const user = await UserModel.findOne({
    forgotPasswordTokenExpiry: { $gte: Date.now() },
  });

  if (!user) throw new CustomErrors("Token is invalid or expired", StatusCodes.UNAUTHORIZED);

  const validToken = await bcrypt.compare(resetToken, user.forgotPasswordToken);

  if (!validToken) {
    throw new CustomErrors("Invalid reset password token provided", StatusCodes.UNAUTHORIZED);
  }

  user.forgotPasswordToken = undefined;
  user.forgotPasswordTokenExpiry = undefined;
  user.password = password;

  await user.save({ validateBeforeSave: false });

  return new ApiResponse(StatusCodes.OK, {}, "Password reset successfully");
});

export const changeCurrentPassword = apiResponseHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await UserModel.findById(req.user?._id);
  if (!user) throw new CustomErrors("User not found", StatusCodes.NOT_FOUND);

  const isMatch = await user.matchPasswords(oldPassword);
  if (!isMatch) throw new CustomErrors("Invalid old password entered", StatusCodes.BAD_REQUEST);

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return new ApiResponse(StatusCodes.OK, {}, "Password changed successfully");
});

export const forgotPassword = apiResponseHandler(
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async (req, res) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) throw new CustomErrors("User not found", StatusCodes.NOT_FOUND);

    const { unHashedToken, hashedToken, tokenExpiry } = await user.generateTemporaryTokens();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordTokenExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    const name = `${user.firstname} ${user.lastname}`;

    const link =
      process.env.NODE_ENV === "production"
        ? process.env.BASE_URL_PRDO_ADMIN
        : process.env.BASE_URL_DEV;

    const resetUrl = `${link}/auth/reset-password/${unHashedToken}`;

    await sendMail({
      to: user.email,
      subject: "Password reset",
      data: {
        resetUrl,
        name,
        appName: process.env.APP_NAME,
      },
      templateName: "forgot-password",
    });

    return new ApiResponse(
      StatusCodes.OK,
      { unHashedToken },
      "Password reset link sent to your email"
    );
  }
);

export const refreshToken = apiResponseHandler(async (req, res) => {
  const { inComingRefreshToken } = req.body;

  const decodedRefreshToken = validateToken(inComingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

  const user = await UserModel.findById(decodedRefreshToken?._id);

  if (!user || inComingRefreshToken !== user.refreshToken) {
    throw new CustomErrors("Token has expired or is invalid", StatusCodes.UNAUTHORIZED);
  }

  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user._id);

  user.refreshToken = newRefreshToken;
  await user.save();

  return new ApiResponse(
    StatusCodes.OK,
    {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    },
    "Access token refreshed successfully"
  );
});

export const verifyEmail = apiResponseHandler(async (req, res) => {
  const { token, userId } = req.query;

  const profile = await ProfileModel.findOne({
    userId,
  });
  const user = await UserModel.findById(userId);

  if (!profile || !user) {
    throw new CustomErrors("Token is invalid or expired", StatusCodes.UNAUTHORIZED);
  }

  if (!token || !user.emailVerificationToken) {
    throw new CustomErrors("Email verification token is missing", StatusCodes.UNAUTHORIZED);
  }

  const validToken = await bcrypt.compare(token, user.emailVerificationToken);

  if (!validToken)
    throw new CustomErrors("Invalid email verification token provided", StatusCodes.UNAUTHORIZED);

  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  profile.isEmailVerified = true;
  await profile.save({ validateBeforeSave: false });

  return new ApiResponse(StatusCodes.OK, { isEmailVerified: true }, "Email verified successfully");
});

export const resendEmailVerification = apiResponseHandler(async (req, res) => {
  const user = await UserModel.findById(req.user?._id);
  const profile = await ProfileModel.findOne({ userId: req.user?._id });

  if (!user || !profile) throw new CustomErrors("User or profile not found", StatusCodes.NOT_FOUND);

  if (profile.isEmailVerified) {
    throw new CustomErrors("Email has already been verified", StatusCodes.CONFLICT);
  }

  const { unHashedToken, hashedToken, tokenExpiry } = await user.generateTemporaryTokens();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  const link =
    process.env.NODE_ENV === "production"
      ? process.env.BASE_URL_PRDO_ADMIN
      : process.env.BASE_URL_DEV;

  const verificationUrl = `${link}/auth/email/verify-email/${user._id}/${unHashedToken}`;
  const name = `${user.firstname} ${user.lastname}`;

  await sendMail({
    to: user.email,
    subject: "Email verification",
    templateName: "resend-verification",
    data: {
      verificationUrl,
      name,
      from: process.env.EMAIL,
      app: process.env.APP_NAME,
    },
  });

  return new ApiResponse(StatusCodes.OK, {}, "email verification link sent to your email");
});
