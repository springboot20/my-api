import { Router } from "express";
import * as transactionController from "../../../controllers/bank/transfer/index.js";
import { verifyJWT } from "../../../middleware/auth/auth.middleware.js";
import { checkPermissions } from "../../../utils/permissions.js";
import { RoleEnums } from "../../../constants.js";

const router = Router();

router
  .route("/")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.ADMIN),
    transactionController.adminTransactionOverview,
  );

router
  .route("/transaction-user-stats")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.ADMIN, RoleEnums.USER),
    transactionController.userTransactionsOverview,
  );

export default router;
