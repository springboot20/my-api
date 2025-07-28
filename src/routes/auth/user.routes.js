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

/**
 * @swagger
 * /users/register:
 *   post:
 *     tags:
 *       - 🔐 Authentication
 *     summary: Register a new user
 *     description: Endpoint for user registration.
 *     operationId: registerUser
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 example: '@codesuite2004'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: codesuite2004@gmail.com
 *               password:
 *                 type: string
 *                 example: '@codesuite2004'
 *               role:
 *                 type: string
 *                 example: ADMIN
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: user successfully created
 *                     statusCode:
 *                       type: integer
 *                       example: 201
 *                     success:
 *                       type: boolean
 *                       example: true
 *       409:
 *         description: User with email or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: user with username or email already exists
 *                     statusCode:
 *                       type: integer
 *                       example: 409
 *                     success:
 *                       type: boolean
 *                       example: false
 */

router.route("/register").post(userRegisterValidation(), validate, register);

/**
 * @swagger
 * /api/auth/register-admin:
 *   post:
 *     summary: Register a new admin user
 *     description: Creates a new admin user, initializes their profile, generates a temporary verification token, and sends an email verification link.
 *     tags:
 *       - 🔐 Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstname
 *               - lastname
 *               - role
 *               - phone_number
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: strongpassword123
 *               firstname:
 *                 type: string
 *                 example: John
 *               lastname:
 *                 type: string
 *                 example: Doe
 *               role:
 *                 type: string
 *                 example: admin
 *               phone_number:
 *                 type: string
 *                 example: "08012345678"
 *     responses:
 *       "201":
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: admin created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     url:
 *                       type: string
 *                       example: https://example.com/verify-email?userId=abc123&token=xyz456
 *       "409":
 *         description: User already exists
 *       "500":
 *         description: Internal server error
 */
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
 *                  email:
 *                    type: string
 *                    example: codesuite2004@gmail.com
 *                  password:
 *                    type: string
 *                    example: '@codesuite2004'
 *              example:
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

/**
 * @swagger
 * /api/users/detail:
 *   get:
 *     summary: Get a user by ID
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: 64f05cf55fbc8b0023456aaa
 *     responses:
 *       200:
 *         description: User details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: user details fetched
 */
router
  .route("/users/detail")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.ADMIN, RoleEnums.MODERATOR, RoleEnums.USER),
    getUserById
  );

/**
 * @swagger
 *  /api/users/{userId}:
 *    delete:
 *      summary: Admin deletes a user (soft delete)
 *      tags:
 *        - Admin
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - name: userId
 *          in: path
 *          required: true
 *          schema:
 *            type: string
 *      responses:
 *        "200":
 *          description: User deleted successfully
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: user deleted successfully
 */
router
  .route("/users/:userId")
  .delete(verifyJWT, checkPermissions(RoleEnums.ADMIN), adminDeleteUser);

/**
 * @swagger
 * /api/users/current-user:
 *   get:
 *     summary: Get current authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Successfully fetched current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Current user fetched successfully
 */
router.route("/users/current-user").get(verifyJWT, getCurrentUser);

export default router;
