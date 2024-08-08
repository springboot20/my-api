import {
  ApiResponse,
  apiResponseHandler,
} from "../../../middleware/api/api.response.middleware.js";
import { UserModel } from "../../../models/index.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { validateToken } from "../../../utils/jwt.js";
import { StatusCodes } from "http-status-codes";
import { generateTokens } from "../login/login.controller.js";
import bcrypt from "bcrypt";
import { sendMail } from "../../../service/email.service.js";

export const resetPassword = apiResponseHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  if (!resetToken)
    throw new CustomErrors(
      "Reset password token is missing",
      StatusCodes.NOT_FOUND,
    );

  const user = await UserModel.findOne({
    _id: req.user.id,
    forgotPasswordTokenExpiry: { $gte: Date.now() },
  });

  if (!user)
    throw new CustomErrors(
      "Token is invalid or expired",
      StatusCodes.UNAUTHORIZED,
    );

  const validToken = await bcrypt.compare(resetToken, user.forgotPasswordToken);

  if (!validToken)
    throw new CustomErrors(
      "Invalid reset password token provided",
      StatusCodes.UNAUTHORIZED,
    );

  user.forgotPasswordToken = undefined;
  user.forgotPasswordTokenExpiry = undefined;
  user.password = password;

  await user.save({ validateBeforeSave: false });

  return new ApiResponse(StatusCodes.OK, {}, "Password reset successfully");
});

export const changeCurrentPassword = apiResponseHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await UserModel.findById(req.user?._id);

  if (!(await user.matchPasswords(oldPassword)))
    throw new CustomErrors("Invalid old password", StatusCodes.BAD_REQUEST);

  user.password = newPassword;
  user.save({ validateBeforeSave: false });

  return new ApiResponse(StatusCodes.OK, {}, "Password changed successfully");
});

export const forgotPassword = apiResponseHandler(async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOne({ email });

  if (!user) throw new CustomErrors("User not found", StatusCodes.NOT_FOUND);

  const { unHashedToken, hashedToken, tokenExpiry } =
    await user.generateTemporaryTokens();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordTokenExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  // const resetLink = `${process.env.BASE_URL}/reset-password/${unHashedToken}`;
  const resetLink = `${req.protocol}//:${req.get(
    "host",
  )}/api/v1/users/reset-password/${unHashedToken}`;

  await sendMail(
    user.email,
    "Password reset",
    { resetLink, username: user.username },
    "reset",
  );

  return new ApiResponse(
    StatusCodes.OK,
    { unHashedToken },
    "Password reset link sent to your email",
  );
});

export const refreshToken = apiResponseHandler(async (req, res) => {
  const {
    body: { inComingRefreshToken },
  } = req;

  const decodedRefreshToken = validateToken(
    inComingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  let user = await UserModel.findByIdAndUpdate(decodedRefreshToken?._id);

  if (!user) {
    throw new CustomErrors("Invalid Token", StatusCodes.UNAUTHORIZED);
  }

  if (inComingRefreshToken !== user?.refreshToken) {
    throw new CustomErrors(
      "Token has expired or has already been used",
      StatusCodes.UNAUTHORIZED,
    );
  }

  const { accessToken, refreshToken } = await generateTokens(user?._id);

  user.refreshToken = refreshToken;
  await user.save({});

  return new ApiResponse(
    StatusCodes.OK,
    {
      tokens: { accessToken, refreshToken },
    },
    "access token refreshed successfully",
  );
});

export const verifyEmail = apiResponseHandler(async (req, res) => {
  const { verificationToken, userId } = req.params;

  if (!verificationToken) {
    throw new CustomErrors(
      "Email verification token is missing",
      StatusCodes.BAD_REQUEST,
    );
  }

  const user = await UserModel.findOne({
    _id: userId,
    emailVerificationTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new CustomErrors(
      "Token is invalid or expired",
      StatusCodes.UNAUTHORIZED,
    );
  }

  const validToken = await bcrypt.compare(
    verificationToken,
    user.emailVerificationToken,
  );

  console.log(validToken);

  if (!validToken)
    throw new CustomErrors(
      "Invalid email verification token provided",
      StatusCodes.UNAUTHORIZED,
    );

  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;
  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return new ApiResponse(
    StatusCodes.OK,
    { isEmailVerified: true },
    "Email verified successfully",
  );
});

export const resendEmailVerification = apiResponseHandler(async (req, res) => {
  const user = await UserModel.findById(req.user?._id);

  if (!user) throw new CustomErrors("User not found", StatusCodes.NOT_FOUND);

  if (user.isEmailVerified) {
    throw new CustomErrors(
      "Email has already been verified",
      StatusCodes.CONFLICT,
    );
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    await user.generateTemporaryTokens();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const verificationLink = `${process.env.BASE_URL}/verify-email/${user._id}/${unHashedToken}`;
  // const verificationLink = `${req.protocol}//:${req.get("host")}/api/v1/users/${
  //   user._id
  // }/verify-email/${unHashedToken}`;

  await sendMail(
    user.email,
    "Password reset",
    { verificationLink, username: user.username },
    "email",
  );

  return new ApiResponse(
    StatusCodes.OK,
    {},
    "email verification link sent to your email",
  );
});
