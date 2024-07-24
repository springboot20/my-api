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
 *            description: user with username or email alredy exists
 */

router
  .route("/users/register")
  .post(userRegisterValidation(), validate, register);


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
 *         '409':
 *            description: user with username or email alredy exists
 */


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
