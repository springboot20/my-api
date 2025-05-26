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

router
  .route("/admin-requests-message/user-pending")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.USER),
    messageRequestController.getUserPendingRequestMessages
  );

router
  .route("/admin-requests-message/update-status")
  .patch(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN),
    messageRequestController.adminUpdateRequestMessageStatus
  );

export default router;
