import { Router } from "express";
import * as messageRequestController from "../../controllers/message/index.js";

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
  .route("/send-message-broadcast")
  .post(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN),
    messageRequestController.adminSendRequest
  );

router
  .route("/admin-requests-message/all")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN),
    messageRequestController.getAllRequestMessages
  );

router
  .route("/admin-requests-message/user-requests")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.USER),
    messageRequestController.getUserRequestMessages
  );

router
  .route("/:requestId")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.USER, RoleEnums.MODERATOR, RoleEnums.ADMIN),
    messageRequestController.getRequestMessageById
  )
  .delete(
    verifyJWT,
    checkPermissions(RoleEnums.USER, RoleEnums.MODERATOR, RoleEnums.ADMIN),
    messageRequestController.deleteRequestMessage
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
