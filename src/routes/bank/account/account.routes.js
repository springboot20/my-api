import { Router } from "express";
import accountController from "../../../controllers/bank/account/index.js";
import { verifyJWT } from "../../../middleware/auth/auth.middleware.js";
import { createAccountSchema } from "../../../validation/app/bank/account.schema.js";
import { validate } from "../../../middleware/validate.middleware.js";

const router = Router();

router
  .route("/create")
  .post(verifyJWT, createAccountSchema(), validate, accountController.createAccount);

export default router;
