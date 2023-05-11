const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../model/UserSchema.js");
const RefreshToken = require("../model/RefreshToken.js");

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

function generateAccessToken(user) {
  const accessToken = jwt.sign({ userId: user._id }, "secret", {
    expiresIn: "30d",
  });

  return accessToken;
}

async function generateRefreshToken(user) {
  const refreshToken = jwt.sign({ userId: user._id }, "secret");
  const expires = new Date(Date.now() + 7 * 1000);

  const tokenDoc = await new RefreshToken({
    userr: user._id,
    token: refreshToken,
    expires,
  });

  await tokenDoc.save();

  return refreshToken;
}

const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser)
      return res.status(409).json({ message: "User do not exist!!" });

    const isCorrectPassword = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isCorrectPassword)
      return res
        .status(409)
        .json({ message: "Invalid password, try aagain!!" });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.status(200).json({ accessToken, refreshToken });
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
