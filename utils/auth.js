const jwt = require("jsonwebtoken");
const User = require("../model/UserSchema.js");

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = jwt.verify(token, "secret");
      req.userData = {
        email: decodedToken.email,
        userId: decodedToken.id,
        username: `${decodedToken.firstname} ${decodedToken.lastname}`,
      };
      // Check if the user with the decoded token exists in the database
      User.findById(decodedToken.id).then((user) => {
        if (!user) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        res.setHeader("authorization", authHeader);
        next();
      });
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = auth;
