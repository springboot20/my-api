const express = require('express');
const router = express.Router();
const transactionControllers = require('../controllers/banking/transactionController');
const { authenticate } = require('../middleware/auth/authentication.js');
const { checkPermissions } = require('../utils/permissions.js');

router.route('/').get([authenticate, checkPermissions('admin')]);
router.route('/transfer').post(authenticate, transactionControllers.createTransactionWallet);
router.route('/stats').get(authenticate, transactionControllers.transactionStatistics);

module.exports = router;
