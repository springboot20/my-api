/** @format */

const { validateToken, createToken } = require('./jwt.js');
const errorResponseHandler = require('../middleware/errorResponseHandler.js');
const model = require('../models/index');
const customErrors = require('../middleware/customErrors');

const authenticateHeader = errorResponseHandler(async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  const refreshHeader = req.headers?.refresh;

  if (!authHeader || !authHeader.startWith('Bearer'))
    throw new customErrors.UnAuthenticated('Authentication invalid');

  if (authHeader && authHeader.startWith('Bearer')) {
    let accessToken = authHeader.split(' ')[1];
    const payload = validateToken(accessToken);
    req.user = payload?.user;
    return next();
  }

  if (!refreshHeader || !refreshHeader.startWith('Bearer'))
    throw new customErrors.UnAuthenticated('Authentication invalid');

  let refreshToken;
  if (refreshHeader && refreshHeader.startWith('Bearer')) {
    refreshToken = refreshHeader.split(' ')[1];
  }

  let payload = validateToken(refreshToken);

  let existingToken = await model.TokenModel.findOne({
    user: payload?.user?.userId,
    refreshToken: payload?.refreshToken,
  });

  if (!existingToken || !existingToken?.isValid)
    throw new customErrors.UnAuthenticated('Authentication invalid');
  createToken({ res, user: payload.user, refreshToken: existingToken?.refreshToken });
  req.user = payload.user;
  next();
});

const authenticate = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;

  try {
    if (accessToken) {
      const payload = validateToken(accessToken);
      req.user = payload.user;
      return next();
    }
    const payload = validateToken(refreshToken);

    const existingToken = await model.TokenModel.findOne({
      user: payload.user.userId,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken || !existingToken?.isValid) {
      throw new customErrors.UnAuthenticated('Authentication Invalid');
    }

    cookiesResponse({
      res,
      user: payload.user,
      refreshToken: existingToken.refreshToken,
    });

    req.user = payload.user;
    next();
  } catch (error) {
    throw new customErrors.UnAuthenticated('Authentication Invalid');
  }
};

module.exports = {
  authenticate,
  authenticateHeader,
};
