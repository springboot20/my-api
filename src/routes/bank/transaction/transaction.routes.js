import { Router } from "express";
import * as transactionController from "../../../controllers/bank/transfer/index.js";
import { verifyJWT } from "../../../middleware/auth/auth.middleware.js";
import { RoleEnums } from "../../../constants.js";
import { checkPermissions } from "../../../utils/permissions.js";

const router = Router();

router
  .route("/paystack/initialize-payment")
  .post(verifyJWT, transactionController.initiatePaystackDepositTransaction);

router.route("/paystack/send-transaction").post(verifyJWT, transactionController.sendTransaction);

router
  .route("/paystack/validate-pin")
  .post(verifyJWT, transactionController.validateTransactionPin);

router
  .route("/paystack/verify-callback")
  .get(verifyJWT,checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN), transactionController.verifyPaystackDepositTransaction);

router
  .route("/paystack/webhook")
  .post(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN),
    transactionController.verifyPaystackWebhook
  );

router
  .route("/")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN),
    transactionController.getAllTransactions
  );

router
  .route("/details")
  .get(
    verifyJWT,
    checkPermissions(RoleEnums.MODERATOR, RoleEnums.ADMIN),
    transactionController.getTransactionById
  );

router.route("/user").get(verifyJWT, transactionController.getUserTransactionsByType);

export default router;
