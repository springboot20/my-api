import { verifyJWT } from "../../middleware/auth/auth.middleware.js";
import { createUserProfile, getUserProfile } from "../../controllers/auth/index.js";
import { Router } from "express";

const router = Router();

router.use(verifyJWT);

router.route("/").patch(createUserProfile).get(getUserProfile);
export default router;
