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
  getUserById,
  registerAdminUser,
  adminDeleteUser,
  handleSocialLogin,
} from "../../controllers/auth/index.js";
import { verifyJWT } from "../../middleware/auth/auth.middleware.js";
import { checkPermissions } from "../../utils/permissions.js";
import {
  userLoginValidation,
  userResetPasswordValidation,
  userRegisterValidation,
  userValidation,
} from "../../validation/app/auth/user.validators.js";
// import { mongoPathVariableValidation, mongoRequestBodyValidation } from "../../validation/mongo/mongoId.validators.js";
import { validate } from "../../middleware/validate.middleware.js";
import { uploadAvatar, upload } from "../../controllers/auth/upload/uploads.controller.js";
import { RoleEnums } from "../../constants.js";

import { Router } from "express";

import passport from "passport";

const router = Router();

router.route("/register").post(userRegisterValidation(), validate, register);

router.route("/register/admin").post(userRegisterValidation(), validate, registerAdminUser);

router.route("/login").post(userLoginValidation(), validate, login);

router.route("/upload-avatar").patch(verifyJWT, upload, uploadAvatar);

router.route("/forgot-password").post(userValidation(), validate, forgotPassword);

router.route("/refresh-token").post(refreshToken);

router.route("/verify-email").post(verifyEmail);

// secured routes

router.route("/logout").post(verifyJWT, logout);

router.route("/resend-email-verification/").post(verifyJWT, resendEmailVerification);

router
  .route("/reset-password/:resetToken")
  .post(verifyJWT, userResetPasswordValidation(), validate, resetPassword);

router.route("/change-password").patch(verifyJWT, changeCurrentPassword);

router
  .route("/users")
  .get(verifyJWT, checkPermissions(RoleEnums.ADMIN, RoleEnums.MODERATOR), getUsers);

router
  .route("/users/detail")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.ADMIN, RoleEnums.MODERATOR, RoleEnums.USER),
    getUserById
  );

router
  .route("/users/:userId")
  .delete(verifyJWT, checkPermissions(RoleEnums.ADMIN), adminDeleteUser);

router.route("/users/current-user").get(verifyJWT, getCurrentUser);

// SSO routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
  (req, res) => {
    res.send("redirecting...");
  }
);

const client_sso_redirect_url =
  process.env?.["NODE_ENV"] === "production"
    ? process.env?.["CLIENT_SSO_REDIRECT_URL_PROD"]
    : process.env?.["CLIENT_SSO_REDIRECT_URL_DEV"];

router.get(
  "/google/redirect",
  passport.authenticate("google", {
    failureRedirect: `${client_sso_redirect_url}?error=GOOGLE_REGISTERED`,
    failureMessage: true,
  }),
  handleSocialLogin
);

export default router;
