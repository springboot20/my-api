const jwt = require("jsonwebtoken");
const User = require("../model/UserSchema.js");

const auth = async (req, res, next) => {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res
      .status(401)
      .json({ message: "Unauthorized: access token missing" });
  }

  try {
    const decodedToken = jwt.verify(accessToken, "secret");
    req.userData = {
      userId: decodedToken.userId,
    };

    // Check if the user with the decoded token exists in the database
    const user = await User.findById(decodedToken.userId);
    
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: invalid access token" });
    }

    // If the access token is valid, allow the request
    res.setHeader("Authorization", `Bearer ${accessToken}`);
    next();
  } catch (error) {
    if (error) {
      return res
        .status(401)
        .json({ message: "Unauthorized: access token invalid or expired" });
    }
  }
};

module.exports = auth;
