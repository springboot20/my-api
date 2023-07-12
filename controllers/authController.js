const withTransaction = require('../middleware/mongooseTransaction');
const errorResponseHandler = require('../middleware/errorResponseHandler');
const customErrors = require('../middleware/customErrors');
const model = require('../model/index');
const { StatusCodes } = require('http-status-codes');

const createTokenUser = require('../utils/createTokenUser');
const { createToken } = require('../utils/jwt');
const crypto = require('crypto');

const register = errorResponseHandler(
  withTransaction(async (req, res, session) => {
    const { email, ...rest } = req.body;

    const user = await model.UserModel.findOne({ email });
    if (user) throw new customErrors.BadRequest('User already exists');

    const isFirstAccount = (await model.UserModel.countDocuments({})) === 0;
    const role = isFirstAccount ? 'admin' : 'user';

    const userDocument = await model.UserModel({ ...rest, email, role });
    await userDocument.save({ session });

    res.status(StatusCodes.CREATED);
    return userDocument;
  })
);

const login = errorResponseHandler(
  withTransaction(async (req, res, session) => {
    const { email, password } = req.body;

    const user = await model.UserModel.findOne({ email });

    if (!email || !password) throw new customErrors.BadRequest('please provide an email and a password');
    if (!user) throw new customErrors.UnAuthenticated('User does not exist');

    if (!(await user.matchPasswords(password))) throw new customErrors.BadRequest('Invalid credentials');

    let refreshToken = '';
    let tokenUser = createTokenUser(user);
    const existingToken = await model.TokenModel.findOne({ user: user._id });

    if (existingToken) {
      const { isValid } = existingToken;

      if (!isValid) throw new customErrors.UnAuthenticated('Invalid credentials');

      refreshToken = existingToken.refreshToken;
      createToken({ res, user: tokenUser, refreshToken });
      res.status(StatusCodes.OK).json({ user: tokenUser });
      return;
    }

    refreshToken = crypto.randomBytes(40).toString('hex');
    const userAgent = req?.headers['user-agent'];
    const ip = req?.ip;
    const userToken = { refreshToken, ip, userAgent, user: user._id };

    const token = await model.TokenModel(userToken);
    await token.save({ session });

    let authToken = createToken({ res, user: tokenUser, refreshToken });

    res.status(StatusCodes.OK);
    return { tokenUser, authToken };
  })
);

const logout = errorResponseHandler(
  withTransaction(async (req, res, session) => {
    // await model.TokenModel.deleteOne({ user: req?.user?.userId }, { session });
    // res.setHeader('Authorization', '');
    // res.setHeader('Refresh', '');
    // res.status(StatusCodes.OK);
    // return { message: 'You have successfully logged out' };
  })
);

module.exports = {
  register,
  login,
  logout,
};
