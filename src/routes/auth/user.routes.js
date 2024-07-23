import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  verifyEmail,
  resendEmailVerification,
  resetPassword,
  changeCurrentPassword,
  getUsers,
  getCurrentUser,
} from "../../controllers/auth/index.js";
import { verifyJWT } from "../../middleware/auth/auth.middleware.js";
import { checkPermissions } from "../../utils/permissions.js";
import {
  userLoginValidation,
  userResetPasswordValidation,
  userRegisterValidation,
  userForgotPasswordValidation,
} from "../../validation/app/auth/user.validators.js";
import { mongoPathVariableValidation } from "../../validation/mongo/mongoId.validators.js";
import { validate } from "../../validation/validate.middleware.js";

const router = Router();

// unsecured routes
router.route("/register").post(userRegisterValidation(), validate, register);

router.route("/login").post(userLoginValidation(), validate, login);

router
  .route("/forgot-password")
  .post(userForgotPasswordValidation(), validate, forgotPassword);

router.route("/refresh-token").post(refreshToken);

router
  .route("/verify-email/:userId/:verificationToken")
  .get(mongoPathVariableValidation("userId"), validate, verifyEmail);

// secured routes
router.route("/logout").post(verifyJWT, logout);

router
  .route("/resend-email-verification/")
  .post(verifyJWT, resendEmailVerification);

router
  .route("/reset-password/:resetToken")
  .post(verifyJWT, userResetPasswordValidation(), validate, resetPassword);

router.route("/change-password").patch(verifyJWT, changeCurrentPassword);

router.route("/").get(verifyJWT, checkPermissions("admin"), getUsers);

router.route("/current-user").get(verifyJWT, getCurrentUser);

export { router };
