const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../model/UserSchema.js");

const signUp = async (req, res) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists...." });

    if (password !== confirmPassword)
      return res.status(409).json({ message: "Password should match..." });
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await User.create({
      username: `${firstname} ${lastname}`,
      email,
      password: hashedPassword,
      confirmPassword,
    });
    const token = jwt.sign({ email: result.email, id: result._id }, "secret", {
      expiresIn: "7h",
    });
    res.status(200).json({ result, token });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "Something went wrong!! try again." });
  }
};
const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser)
      return res.status(409).json({ message: "User do not exist!!" });

    const isCorrectPassword = bcrypt.compare(password, existingUser.password);
    if (!isCorrectPassword)
      return res
        .status(409)
        .json({ message: "Invalid password, try aagain!!" });

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      "secret",
      {
        expiresIn: "7h",
      }
    );
    res.status(200).json({ result: existingUser, token });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "Something went wrong!! tyr again." });
  }
};

module.exports = {
  signIn,
  signUp,
};
