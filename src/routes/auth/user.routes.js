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
  userValidation,
} from "../../validation/app/auth/user.validators.js";
import { mongoPathVariableValidation } from "../../validation/mongo/mongoId.validators.js";
import { validate } from "../../middleware/validate.middleware.js";
import { uploadAvatar, upload } from "../../controllers/auth/upload/uploads.controller.js";
import { RoleEnums } from "../../constants.js";

import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /users/register:
 *    post:
 *       tags:
 *         - 🔐 Authentication
 *       summary: Register new user
 *       description: >-
 *          Api endopint that allows users to register or signup to create an account
 *       operationId: registerUser
 *       requestBody:
 *          required: true
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  username:
 *                    type: string
 *                    example: '@codesuite2004'
 *                  email:
 *                    type: string
 *                    example: codesuite2004@gmail.com
 *                  password:
 *                    type: string
 *                    example: '@codesuite2004'
 *                  role:
 *                    type: string
 *                    example: ADMIN
 *              example:
 *                username: '@codesuite2004'
 *                email: codesuite2004@gmail.com
 *                password: '@codesuite2004'
 *                role: ADMIN
 *       responses:
 *         '201':
 *            description: Register user
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  properties:
 *                    data:
 *                      types: object
 *                      properties:
 *                        message:
 *                          type: string
 *                          example: user successfully created
 *                        statusCode:
 *                          type: number
 *                          example: 201
 *                        success:
 *                          type: boolean
 *                          example: true
 *         '409':
 *            description: send response to that tells a user exists
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  properties:
 *                    data:
 *                      types: object
 *                      properties:
 *                        message:
 *                          type: string
 *                          example: user with username or email alredy exists
 *                        statusCode:
 *                          type: number
 *                          example: 409
 *                        success:
 *                          type: boolean
 *                          example: false
 */

router.route("/register").post(userRegisterValidation(), validate, register);

/**
 * @swagger
 * /users/login:
 *    post:
 *       tags:
 *         - 🔐 Authentication
 *       summary: Login user
 *       description: >-
 *          Api endopint that allows users to login into their register account
 *       operationId: loginUser
 *       requestBody:
 *          required: true
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  username:
 *                    type: string
 *                    example: '@codesuite2004'
 *                  email:
 *                    type: string
 *                    example: codesuite2004@gmail.com
 *                  password:
 *                    type: string
 *                    example: '@codesuite2004'
 *              example:
 *                username: '@codesuite2004'
 *                email: codesuite2004@gmail.com
 *                password: '@codesuite2004'
 *       responses:
 *         '200':
 *            description: Login registered user
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  properties:
 *                    data:
 *                      types: object
 *                      properties:
 *                        message:
 *                          type: string
 *                          example: user logged in successfully
 *                        statusCode:
 *                          type: number
 *                          example: 200
 *                        success:
 *                          type: boolean
 *                          example: true
 *         '404':
 *            description: User not found
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  properties:
 *                    data:
 *                      types: object
 *                      properties:
 *                        message:
 *                          type: string
 *                          example: user does not exists
 *                        statusCode:
 *                          type: number
 *                          example: 404
 *                        success:
 *                          type: boolean
 *                          example: false
 *
 *         '400':
 *            description: check for presence of login credentials
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  properties:
 *                    data:
 *                      types: object
 *                      properties:
 *                        message:
 *                          type: string
 *                          example: please provide an email and a password
 *                        statusCode:
 *                          type: number
 *                          example: 400
 *                        success:
 *                          type: boolean
 *                          example: false
 *
 *         '400':
 *            description: check for corelation between the stored password in the database and the one the user is entering
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  properties:
 *                    data:
 *                      types: object
 *                      properties:
 *                        message:
 *                          type: string
 *                          example: invalid password entered
 *                        statusCode:
 *                          type: number
 *                          example: 401
 *                        success:
 *                          type: boolean
 *                          example: false
 *
 */

router.route("/login").post(userLoginValidation(), validate, login);

router.route("/upload").patch(verifyJWT, upload, uploadAvatar);

router.route("/forgot-password").post(userValidation(), validate, forgotPassword);

router.route("/refresh-token").post(verifyJWT, refreshToken);

router
  .route("/verify-email/:id/:token")
  .get(mongoPathVariableValidation("id"), validate, verifyEmail);

// secured routes
router.route("/logout").post(verifyJWT, logout);

router.route("/resend-email-verification/").post(verifyJWT, resendEmailVerification);

router
  .route("/reset-password/:resetToken")
  .post(verifyJWT, userResetPasswordValidation(), validate, resetPassword);

router.route("/change-password").patch(verifyJWT, changeCurrentPassword);

router.route("/").get(verifyJWT, checkPermissions(RoleEnums.ADMIN), getUsers);

router.route("/current-user").get(verifyJWT, getCurrentUser);

export default router;
