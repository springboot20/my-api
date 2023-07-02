/** @format */

const jwt = require('jsonwebtoken');
const User = require('../model/UserSchema.js');
const { errorHandler, HTTPError } = require('../middleware/index.js');

const auth = errorHandler(async (req, res, next) => {
  const accessToken = req.headers?.authorization.split(' ')[1];

  if (!accessToken) {
    throw new HTTPError(401, ' Unauthorized: access token missing');
  }

  try {
    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decodedToken.userId;

    const user = await User.findById(decodedToken.userId);

    if (!user) {
      throw new HTTPError(401, 'Unauthorized: invalid access token');
    }

    res.setHeader('Authorization', `Bearer ${accessToken}`);
    next();
  } catch (error) {
    if (error) {
      throw new HTTPError(401, ' Unauthorized: access token invalid or expired');
    }
  }
});

module.exports = auth;
