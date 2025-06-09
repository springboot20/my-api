import { Router } from "express";
import * as statisticsController from "../../controllers/statistics/statistics.controller.js";
import { verifyJWT } from "../../middleware/auth/auth.middleware.js";
import { checkPermissions } from "../../utils/permissions.js";
import { RoleEnums } from "../../constants.js";

const router = Router();

router
  .route("/")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.ADMIN, RoleEnums.MODERATOR),
    statisticsController.getAllStatistics
  );

router
  .route("/transactions")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.ADMIN, RoleEnums.MODERATOR),
    statisticsController.transactionsStatistics
  );

router
  .route("/users")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.ADMIN, RoleEnums.MODERATOR),
    statisticsController.usersStatistics
  );

router
  .route("/accounts")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.ADMIN, RoleEnums.MODERATOR),
    statisticsController.accountsStatistics
  );

export default router;
