import { verifyJWT } from "../../../middleware/auth/auth.middleware.js";
import { Router } from "express";
import {
  createNewCard,
  generateCardNumber,
  linkCardToAccount,
} from "../../../controllers/bank/cards/create-card/create-card.controller.js";
import { getCards } from "../../../controllers/bank/cards/get-cards/get-card.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/create-card").post(createNewCard).get(getCards);
router.route("/create-card/generate-number").post(generateCardNumber);
router.route("/create-card/link-card").post(linkCardToAccount);

export default router;
