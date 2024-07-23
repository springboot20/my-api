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
} from "../controllers/auth/index.js";
import { verifyJWT } from "../middleware/auth/auth.middleware.js";
import { checkPermissions } from "../utils/permissions.js";
import {
  userLoginValidation,
  userResetPasswordValidation,
  userRegisterValidation,
  userForgotPasswordValidation,
} from "../validation/app/auth/user.validators.js";
import { mongoPathVariableValidation } from "../validation/mongo/mongoId.validators.js";
import { validate } from "../validation/validate.middleware.js";

const router = Router();

/**
 * @swagger
 * /healthcheck:
 *    get:
 *       summary: Check if the application is up an running
 *       description: Response if the app is up and running
 *       responses:
 *         200:
 *           description: Check if is running well
 *         400:
 *           description: Server could not understand the request due to invalid syntax
 */
router.get("/healthcheck", (req, res) => res.sendStatus(200));

/**
 * @swagger
 * /users/register:
 *    post:
 *       summary: Register new user
 *       requestBody:
 *          required: true
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  username:
 *                   type: string
 *                  email:
 *                   type: string
 *                  password:
 *                   type: string
 *       responses:
 *         '201':
 *            description: user successfully created
 *         '409':
 *            description: user with username or email alredy exists
 */
router
  .route("/users/register")
  .post(userRegisterValidation(), validate, register);

router.route("/users/login").post(userLoginValidation(), validate, login);

router
  .route("/users/forgot-password")
  .post(userForgotPasswordValidation(), validate, forgotPassword);

router.route("/users/refresh-token").post(refreshToken);

router
  .route("/users/verify-email/:userId/:verificationToken")
  .get(mongoPathVariableValidation("userId"), validate, verifyEmail);

// secured routes
router.route("/users/logout").post(verifyJWT, logout);

router
  .route("/users/resend-email-verification/")
  .post(verifyJWT, resendEmailVerification);

router
  .route("/users/reset-password/:resetToken")
  .post(verifyJWT, userResetPasswordValidation(), validate, resetPassword);

router.route("/users/change-password").patch(verifyJWT, changeCurrentPassword);

router.route("/users/").get(verifyJWT, checkPermissions("admin"), getUsers);

router.route("/users/current-user").get(verifyJWT, getCurrentUser);

export { router };

/**
 * {
  "username": "abbas",
  "email": "abbas@gmail.com",
  "password": "@codesuitedev20"
}
 */
