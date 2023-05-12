const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../model/UserSchema.js");
const RefreshToken = require("../model/RefreshToken.js");


function generateAccessToken(userId) {
  const accessToken = jwt.sign({ userId: userId }, "secret", {
    expiresIn: "30s",
  });

  return accessToken;
}

function generateRefreshToken(userId, refreshId) {
  const refreshToken = jwt.sign({ userId: userId, tokenId: refreshId }, "refresh_secret", { expiresIn: "30d" });
  return refreshToken;
}

async function validateRefreshToken(token) {
  const decodeToken = () => {
    try {
      return jwt.verify(token, "refresh_secrete")
    } catch (error) {
      return error.message
    }
  }

  const decodedToken = decodeToken()
  const tokenExist = await RefreshToken.exists({ _id: decodedToken.tokenId })
  if (tokenExist) {
    return decodedToken
  } else {
    return new Error("Unauthorized")
  }
}

const signUp = async (req, res) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(409).json({ message: "User already exists...." });

    if (password !== confirmPassword)
      return res.status(409).json({ message: "Password should match..." });

    const hashedPassword = await bcrypt.hash(password, 12);

    const userDoc = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      confirmPassword,
    });

    const refreshTokenDoc = new RefreshToken({
      owner: userDoc.id
    })

    await userDoc.save()
    await refreshTokenDoc.save()

    const refreshToken = generateRefreshToken(userDoc.id, refreshTokenDoc.id)
    const accessToken = generateAccessToken(userDoc.id)

    res.status(200).json({ id: userDoc.id, accessToken, refreshToken });
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
    const userDoc = await User.findOne({ email });

    if (!userDoc)
      return res.status(409).json({ message: "User do not exist!!" });

    const isCorrectPassword = await bcrypt.compare(
      password,
      userDoc.password
    );

    if (!isCorrectPassword)
      return res
        .status(409)
        .json({ message: "Invalid password, try aagain!!" });

    const refreshTokenDoc = new RefreshToken({
      owner: userDoc.id
    })

    await refreshTokenDoc.save()

    const refreshToken = generateRefreshToken(userDoc.id, refreshTokenDoc.id)
    const accessToken = generateAccessToken(userDoc.id)

    res.status(200).json({ id: userDoc.id, accessToken, refreshToken });

  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "Something went wrong!! tyr again." });
  }
};

// Middleware to authenticate the refresh token
const newRefreshToken = async (req, res, next) => {
  const currentRefreshToken = await validateRefreshToken(req.body.refreshToken)
  const refreshTokenDoc = new RefreshToken({
    userId: currentRefreshToken.userId
  })

  await refreshTokenDoc.save();
  await RefreshToken.deleteOne({ id: currentRefreshToken.tokenId })


  const refreshToken = generateRefreshToken(currentRefreshToken.userId, refreshTokenDoc.id)
  const accessToken = generateAccessToken(currentRefreshToken.userId)

  res.status(200).json({ id: currentRefreshToken.userId, accessToken, refreshToken });
};

const newAccessToken = async (req, res, next) => {
  const refreshToken = await validateRefreshToken(req.body.refreshToken)
  const accessToken = generateAccessToken(refreshToken.userId)


  res.status(200).json({ id: refreshToken.userId, accessToken, refreshToken: req.body.refreshToken });
};

const logout = async () => {
  const refreshToken = await validateRefreshToken(req.body.refreshToken)
  await RefreshToken.deleteOne({ _id: refreshToken.tokenId })

  res.json({ success: true })
}
module.exports = {
  signIn,
  signUp,
  newRefreshToken,
  newAccessToken,
  logout
};
