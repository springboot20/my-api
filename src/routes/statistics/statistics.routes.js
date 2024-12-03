import { Router } from "express";
import * as statisticsController from "../../controllers/statistics/statistics.controller.js";
import { verifyJWT } from "../../middleware/auth/auth.middleware.js";
import { checkPermissions } from "../../utils/permissions.js";
import { RoleEnums } from "../../constants.js";

const router = Router();

router
  .route("/transactions")
  .get(verifyJWT, checkPermissions(RoleEnums.ADMIN), statisticsController.adminTransactionOverview);

router
  .route("/transactions/user-stats")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.ADMIN, RoleEnums.USER),
    statisticsController.userTransactionsOverview,
  );

export default router;
