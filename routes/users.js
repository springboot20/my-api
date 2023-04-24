import express from "express";
import { signIn, signUp } from "../controllers/user.js";
import User from "../model/UserSchema.js";

const router = express.Router();

router.get("/signup", async (req, res) => {
  console.log(req.body);

  try {
    const results = await User.find();
    res.send(results);
  } catch (error) {
    console.log(error.message);
  }
});

router.get("/signin", async (req, res) => {
  console.log(req.body);

  try {
    const results = await User.find();
    res.send(results);
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/signup", signUp);
router.post("/signin", signIn);

export default router;
