import { Router } from "express";
import accountController from "../../../controllers/bank/account/index.js";
import { verifyJWT } from "../../../middleware/auth/auth.middleware.js";
import { createAccountSchema } from "../../../validation/app/bank/account.schema.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { checkPermissions } from "../../../utils/permissions.js";
import { RoleEnums } from "../../../constants.js";

const router = Router();

router
  .route("/create")
  .post(
    verifyJWT,
    createAccountSchema(),
    validate,
    checkPermissions(RoleEnums.USER, RoleEnums.MODERATOR, RoleEnums.ADMIN),
    accountController.createAccount
  );

router
  .route("/")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN),
    accountController.getUsersAccounts
  );

router
  .route("/validate-account")
  .post(
    verifyJWT,
    checkPermissions(RoleEnums.USER, RoleEnums.MODERATOR, RoleEnums.ADMIN),
    accountController.validateAccountNumber
  );

router
  .route("/user-accounts")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.USER, RoleEnums.MODERATOR, RoleEnums.ADMIN),
    accountController.getUserAccounts
  );

router
  .route("/admin/update-account/:userId/:accountId")
  .patch(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN),
    accountController.adminUpdateAccountStatus
  );

router
  .route("/user-accounts/:accountId")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.USER, RoleEnums.MODERATOR, RoleEnums.ADMIN),
    accountController.getAccountDetails
  )
  .patch(
    verifyJWT,
    checkPermissions(RoleEnums.USER, RoleEnums.MODERATOR, RoleEnums.ADMIN),
    accountController.updateAccountStatus
  );

router
  .route("/user-accounts/close/:accountId")
  .patch(
    verifyJWT,
    checkPermissions(RoleEnums.USER, RoleEnums.MODERATOR, RoleEnums.ADMIN),
    accountController.closeAccount
  );

router
  .route("/admin/user-accounts/delete/:accountId")
  .delete(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN),
    accountController.adminDeleteUserAccount
  );

router
  .route("/admin/user-accounts/details/:userId/:accountId")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN),
    accountController.adminGetAccountDetails
  );

export default router;
