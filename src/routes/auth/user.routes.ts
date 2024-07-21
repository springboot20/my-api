import { Router } from 'express';
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
} from '@controllers/auth/index.js';
import { verifyJWT } from '@middleware/auth/auth.middleware.js';
import { checkPermissions } from '@utils/permissions.js';

const router = Router();

// unsecured routes
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/forgot-password').post(forgotPassword);
router.route('/refresh-token').post(refreshToken);
router.route('/verify-email/:verificationToken').get(verifyEmail);

// secured routes
router.route('/logout').post(verifyJWT, logout);
router.route('/resend-email-verification/').post(verifyJWT, resendEmailVerification);
router.route('/reset-password/:resetToken').post(verifyJWT, resetPassword);
router.route('/change-password').patch(verifyJWT, changeCurrentPassword);
router.route('/').get(verifyJWT, checkPermissions('admin'), getUsers);
router.route('/current-user').get(verifyJWT, getCurrentUser);

export { router };
