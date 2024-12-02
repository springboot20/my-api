import { Router } from "express";
import * as transactionController from "../../../controllers/bank/transfer/index.js";
import { verifyJWT } from "../../../middleware/auth/auth.middleware.js";

const router = Router();

router
  .route("/paystack/initialize-payment")
  .post(verifyJWT, transactionController.initiatePaystackDepositTransaction);

router
  .route("/paystack/verify-callback")
  .post(verifyJWT, transactionController.verifyPaystackDepositTransaction);

export default router;
