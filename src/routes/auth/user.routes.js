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

const router = Router();

router.route("/register").post(userRegisterValidation(), validate, register);

router.route("/login").post(userLoginValidation(), validate, login);

router.route("/upload").patch(verifyJWT, upload, uploadAvatar);

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

export default router;
