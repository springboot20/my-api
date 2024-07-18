import { Router } from 'express';
import { register, login, logout, refreshToken, forgotPassword } from '@controllers/auth/index';
import { verifyJWT } from '@middleware/auth/auth.middleware';
import { checkPermissions } from '@utils/permissions';

const router = Router();

// unsecured routes
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/forgot-password').post(forgotPassword);
router.route('/refresh-token').post(refreshToken);

// secured routes
router.route('/logout').post(verifyJWT, logout);
router.route('/users').get(verifyJWT, checkPermissions('admin'));
router.route('/stats').get(verifyJWT, checkPermissions('admin'));
router.route('/current-user').get(verifyJWT);
router.route('/:id').get(verifyJWT, userControllers.getSingleUser);
router.route('/:id').patch(verifyJWT, userControllers.updateUser);

export { router };
