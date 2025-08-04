import { Router } from "express";
import * as transactionController from "../../../controllers/bank/transfer/index.js";
import { verifyJWT } from "../../../middleware/auth/auth.middleware.js";
import { RoleEnums } from "../../../constants.js";
import { checkPermissions } from "../../../utils/permissions.js";

const router = Router();

router
  .route("/paystack/deposit")
  .post(verifyJWT, transactionController.initiatePaystackDepositTransaction);

router.route("/paystack/transfer").post(verifyJWT, transactionController.sendTransaction);

router
  .route("/paystack/validate-pin")
  .post(verifyJWT, transactionController.validateTransactionPin);

router
  .route("/paystack/verify-callback")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.USER, RoleEnums.ADMIN),
    transactionController.verifyPaystackCallback
  );

router
  .route("/")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN),
    transactionController.getAllTransactions
  );

// Download receipt as PDF
router
  .route("/receipt/download/:transactionId")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN, RoleEnums.USER),
    transactionController.downloadTransactionById
  );

// Get receipt data for sharing
router
  .route("/receipt/share/:transactionId")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN, RoleEnums.USER),
    transactionController.getReceiptData
  );

router
  .route("/details")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN, RoleEnums.USER),
    transactionController.getTransactionById
  );

router
  .route("/delete")
  .delete(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN, RoleEnums.USER),
    transactionController.deleteTransactionById
  );

router.route("/user").get(verifyJWT, transactionController.getUserTransactions);

router
  .route("/paystack/webhook")
  .post(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.USER, RoleEnums.ADMIN),
    transactionController.verifyPaystackWebhook
  );

export default router;
