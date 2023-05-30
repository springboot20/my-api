const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../model/UserSchema.js");
const RefreshToken = require("../model/RefreshToken.js");
const { errorHandler, withTransactions, HTTPError } = require("../error/index.js");


function generateAccessToken(userId) {
  const accessToken = jwt.sign({ userId: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });

  return accessToken;
}

function generateRefreshToken(userId, refreshId) {
  const refreshToken = jwt.sign({ userId: userId, tokenId: refreshId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "30d" });
  return refreshToken;
}

async function validateRefreshToken(token) {
  const decodeToken = () => {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
    } catch (error) {
      return error.message
    }
  }

  const decodedToken = decodeToken()
  const tokenExist = await RefreshToken.exists({ _id: decodedToken.tokenId })
  if (tokenExist) {
    return decodedToken
  } else {
    return new HTTPError(401, "Unauthorized")
  }
}

const signUp = errorHandler(withTransactions(async (req, res, session) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser)
    throw new HTTPError(409, "User already exists....");

  if (password !== confirmPassword)
    throw new HTTPError(409, "Password should match...");

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

  await userDoc.save({ session })
  await refreshTokenDoc.save({ session })

  const refreshToken = generateRefreshToken(userDoc.id, refreshTokenDoc.id)
  const accessToken = generateAccessToken(userDoc.id)

  return {
    id: userDoc.id,
    accessToken,
    refreshToken
  }
}))


const signIn = errorHandler(withTransaction(async (req, res, session) => {
  const { email, password } = req.body;

  const userDoc = await User.findOne({ email });

  if (!userDoc)
    throw new HTTPError(409, "User do not exist!!");

  const isCorrectPassword = await bcrypt.compare(
    password,
    userDoc.password
  );

  if (!isCorrectPassword)
    throw new HTTPError(409, "Invalid password, try aagain!!");

  const refreshTokenDoc = new RefreshToken({
    owner: userDoc.id
  })

  await refreshTokenDoc.save({ session })

  const refreshToken = generateRefreshToken(userDoc.id, refreshTokenDoc.id)
  const accessToken = generateAccessToken(userDoc.id)

  return { id: userDoc.id, accessToken, refreshToken };

}));

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

const newAccessToken = error(async (req, res, next) => {
  const refreshToken = await validateRefreshToken(req.body.refreshToken)
  const accessToken = generateAccessToken(refreshToken.userId)

  return { id: refreshToken.userId, accessToken, refreshToken: req.body.refreshToken };
});

const logout = errorHandler(withTransactions(async (req, res, session) => {
  const refreshToken = await validateRefreshToken(req.body.refreshToken)
  await RefreshToken.deleteOne({ _id: refreshToken.tokenId }, { session })

  return { success: true }
}))
module.exports = {
  signIn,
  signUp,
  newRefreshToken,
  newAccessToken,
  logout
};
