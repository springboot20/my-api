const express = require('express');
const userControllers = require('../controllers/userController.js');
const { authenticate } = require('../utils/authentication.js');
const { checkPermissions } = require('../utils/permissions.js');

const router = express.Router();

router.route('/').get([authenticate, checkPermissions('admin')], userControllers.getUsers);

router.route('/stats').get(userControllers.userStats);
router.route('/current-user').get(authenticate, userControllers.currentUser);
router.route('/:id').get(authenticate, userControllers.getSingleUser);
router.route('/:id').patch(authenticate, userControllers.updateUser);

module.exports = router;
