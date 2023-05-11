const express = require("express");
const { signIn, signUp } = require("../controllers/user.js");
const User = require("../model/UserSchema.js");
const auth = require("../utils/auth.js");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const results = await User.find({});
    res.send(results);
  } catch (error) {
    console.log(error.message);
  }
});

router.get("/auth/me", auth, async (req, res) => {
  try {
    console.log(req.userData.userId);
    const user = await User.findById(req.userData.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/auth/signup", signUp);
router.post("/auth/signin", signIn);

module.exports = router;
