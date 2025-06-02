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
  registerAdminUser
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
router.route("/register/admin").post(registerAdminUser);

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
 *            description: check for the presence of login credentials
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
 *         '401':
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

router.route("/refresh-token").post(refreshToken);

router.route("/verify-email").post(verifyEmail);

// secured routes

/**
 * @swagger
 * /users/logout:
 *    post:
 *       tags:
 *         - 🔐 Authentication
 *       summary: Logout user
 *       description: >-
 *          Api endopint that allows users to logout of their register account
 *       operationId: logoutUser
 *       responses:
 *         '200':
 *            description: Logout registered user
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
 *                          example: you have successfully logged out
 *                        statusCode:
 *                          type: number
 *                          example: 200
 *                        success:
 *                          type: boolean
 *                          example: true
 *         '401':
 *            description: check if authorization credential is present on the request
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
 *                          example: verifyJWT Invalid
 *                        statusCode:
 *                          type: number
 *                          example: 401
 *                        success:
 *                          type: boolean
 *                          example: false
 *
 */
router.route("/logout").post(verifyJWT, logout);

router.route("/resend-email-verification/").post(verifyJWT, resendEmailVerification);

router
  .route("/reset-password/:resetToken")
  .post(verifyJWT, userResetPasswordValidation(), validate, resetPassword);

/**
 * @swagger
 * /users/change-password:
 *    patch:
 *       tags:
 *         - 🔐 Authentication
 *       summary: Change already logged in user password
 *       description: >-
 *          Api endopint that allows logged in users to change their register account password
 *       operationId: changeUserPassword
 *       requestBody:
 *          required: true
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  oldPassword:
 *                    type: string
 *                    example: '@codesuite2004'
 *                  newPassword:
 *                    type: string
 *                    example: codesuite@2004
 *              example:
 *                oldPassword: '@codesuite2004'
 *                newPassword: 'codesuite@2004'
 *       responses:
 *         '200':
 *            description: Change user current password
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
 *                          example: Password changed successfully
 *                        statusCode:
 *                          type: number
 *                          example: 200
 *                        success:
 *                          type: boolean
 *                          example: true
 *
 *         '400':
 *            description: check for corelation between the old password in the database and the new password the user is entering
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
 *                          example: invalid old password entered
 *                        statusCode:
 *                          type: number
 *                          example: 400
 *                        success:
 *                          type: boolean
 *                          example: false
 *
 */
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

router.route("/users/current-user").get(verifyJWT, getCurrentUser);

export default router;
