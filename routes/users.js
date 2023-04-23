import express from "express";
import User from "../model/UserSchema.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  // const { username, email, password, confirmPassword } = req.body;

  // if (!username || !email || !password || !confirmPassword) {
  //   return res
  //     .status(400)
  //     .send("Username, email, password and confirmPassword are required");
  // }

  // const existingUser = await User.findOne({ email });
  // if (existingUser) {
  //   return res.status(409).send("Email already in use");
  // }

  try {
    let user = new User(req.body);
    const result = await user.save();

    console.log(result);

    res.send(result);
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).send("Invalid email or password");
  }

  if (user.password !== password) {
    return res.status(401).send("Invalid email or password");
  }

  // res.send("hello world from users page");
  res.send("Logged in succefully");
});

router.get("/", (req, res) => {
  console.log(req.body);
  res.send("hello world from users page");
});

router.get("/login", (req, res) => {
  console.log(req.body);
  res.send("hello world from login page");
});

export default router;
