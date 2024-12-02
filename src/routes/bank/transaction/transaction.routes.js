import { Router } from "express";
import * as transactionController from "../../../controllers/bank/transfer/index.js";
import { verifyJWT } from "../../../middleware/auth/auth.middleware.js";

const router = Router();

router
  .route("/paystack/initialize-payment")
  .post(verifyJWT, transactionController.initiatePaystackDepositTransaction);

router
  .route("/paystack/verify-callback")
  .get(verifyJWT, transactionController.verifyPaystackDepositTransaction);

router
  .route("/paystack/webhook")
  .post(verifyJWT, transactionController.verifyPaystackWebhook);

export default router;
