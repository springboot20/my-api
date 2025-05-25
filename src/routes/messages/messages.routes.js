import { Router } from "express";
import * as messageRequestController from "../../controllers/message/message.controller.js";

import { verifyJWT } from "../../middleware/auth/auth.middleware.js";
import { checkPermissions } from "../../utils/permissions.js";
import { RoleEnums } from "../../constants.js";

const router = Router();

router
  .route("/admin-requests-message")
  .post(
    verifyJWT,
    checkPermissions(RoleEnums.USER),
    messageRequestController.accountMessageRequest
  );

export default router;
