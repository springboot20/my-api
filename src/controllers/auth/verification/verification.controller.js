import crypto from "crypto";
import {
  ApiResponse,
  apiResponseHandler,
} from "../../../middleware/api/api.response.middleware.js";
import { mongooseTransactions } from "../../../middleware/mongoose/mongoose.transactions.js";
import { UserModel } from "../../../models/index.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { validateToken } from "../../../utils/jwt.js";
import { StatusCodes } from "http-status-codes";
import { generateTokens } from "../login/login.controller.js";
import bcrypt from "bcrypt";
import { sendMail } from "../../../service/email.service.js";

export const resetPassword = apiResponseHandler(
  mongooseTransactions(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    if (!resetToken)
      throw new CustomErrors(
        "Reset password token is missing",
        StatusCodes.BAD_REQUEST,
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
        StatusCodes.UNAUTHORIZED,
      );

    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return new ApiResponse(StatusCodes.OK, {}, "Password reset successfully");
  }),
);

export const changeCurrentPassword = apiResponseHandler(
  mongooseTransactions(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await UserModel.findById(req.user?._id);

    if (!(await user.matchPasswords(oldPassword)))
      throw new CustomErrors("Invalid old password", StatusCodes.BAD_REQUEST);

    user.password = newPassword;
    user.save({ validateBeforeSave: false });

    return new ApiResponse(StatusCodes.OK, {}, "Password changed successfully");
  }),
);

export const forgotPassword = apiResponseHandler(
  mongooseTransactions(async (req, res, session) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) throw new CustomErrors("User not found", StatusCodes.NOT_FOUND);

    const { unHashedToken, hashedToken, tokenExpiry } =
      await user.generateTemporaryTokens();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordTokenExpiry = new Date(tokenExpiry);
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.BASE_URL}/reset-password/${unHashedToken}`;
    await sendMail(
      user.email,
      "Password reset",
      { resetLink, username: user.username },
      "reset-password",
    );

    await user.save({ validateBeforeSave: false, session });
    return new ApiResponse(
      StatusCodes.OK,
      {},
      "Password reset link sent to your email",
    );
  }),
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
          StatusCodes.UNAUTHORIZED,
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
  }),
);

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
    emailVerificationTokenExpiry: { $gte: Date.now() },
  });

  if (!user) {
    throw new CustomErrors(
      "Token is invalid or expired",
      StatusCodes.UNAUTHORIZED,
    );
  }

  if (user.isEmailVerified)
    throw new CustomErrors("Email already verified", StatusCodes.CONFLICT);

  const validToken = await bcrypt.compare(
    verificationToken,
    user.emailVerificationToken,
  );

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

  const verificationLink = `${req.protocol}//:${req.get(
    "host",
  )}/api/v1/users/verify-email/${unHashedToken}`;

  await sendMail(
    user.email,
    "Password reset",
    { verificationLink, username: user.username },
    "email",
  );

  return ApiResponse(
    StatusCodes.OK,
    {},
    "email verification link sent to your email",
  );
});
