const express = require("express");
const {
  signIn,
  signUp,
  newRefreshToken,
  newAccessToken,
  logout,
  me,
  getUsers
} = require("../controllers/user.js");
const auth = require("../utils/auth.js");

const router = express.Router();

router.get("/", getUsers);
router.get("/auth/me", auth, me);
router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/auth/logout", logout);
router.post("/auth/refresh-token", newRefreshToken);
router.post("/auth/access-token", newAccessToken);

module.exports = router;
