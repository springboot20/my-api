import { Router } from 'express';
import accountController from '../../../controllers/bank/account/index.js';
import { verifyJWT } from '../../../middleware/auth/auth.middleware.js';
import { createAccountSchema } from '../../../validation/app/bank/account.schema.js';
import { validate } from '../../../middleware/validate.middleware.js';
import { checkPermissions } from '../../../utils/permissions.js';
import { RoleEnums } from '../../../constants.js';

const router = Router();

router
  .route('/create')
  .post(
    verifyJWT,
    createAccountSchema(),
    validate,
    checkPermissions(RoleEnums.USER),
    accountController.createAccount
  );

router
  .route('/user-accounts')
  .get(verifyJWT, checkPermissions(RoleEnums.USER), accountController.getUserAccounts);

router
  .route('/user-account/:accountId')
  .get(verifyJWT, checkPermissions(RoleEnums.USER), accountController.getAccountDetails)
  .patch(verifyJWT, checkPermissions(RoleEnums.USER), accountController.updateAccountStatus)
  .delete(verifyJWT, checkPermissions(RoleEnums.USER), accountController.deleteUserAccount);

export default router;
