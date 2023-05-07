const express = require("express");
const { signIn, signUp } = require("../controllers/user.js");
const User = require("../model/UserSchema.js");

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
  console.log(req.token);

  try {
    const results = await User.find();
    res.send(results);
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/signup", signUp);
router.post("/signin", signIn);

module.exports = router;
