const express = require('express');
const authControllers = require('../controllers/authController.js');
const { authenticate } = require('../middleware/auth/authentication.js');

const router = express.Router();

router.route('/signup').post(authControllers.register);
router.route('/signin').post(authControllers.login);
router.route('/logout').post(authenticate, authControllers.logout);

module.exports = router;
