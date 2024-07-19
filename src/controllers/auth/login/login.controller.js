import { apiResponseHandler } from '../../../middleware/api/api.response.middleware.js';
import { BadRequest, NotFound, UnAuthorized } from '../../../middleware/custom/custom.errors.js';
import { mongooseTransactions } from '../../../middleware/mongoose/mongoose.transactions.js';
import { UserModel } from '../../../models/index.js';
import { generateTokens } from '../../../utils/jwt.js';

export const login = apiResponseHandler(
  mongooseTransactions(async (req, res) => {
    const { email, password, username } = req.body;

    const user = await UserModel.findOne({ $or: [{ email }, { username }] });

    if (!user) throw new NotFound('user does not exists');
    if (!(email && password)) throw new BadRequest('please provide an email and a password');
    if (!(await user.matchPassword(password))) throw new UnAuthorized('invalid password entered');

    const { accessToken, refreshToken } = await generateTokens(user?._id);

    const loggedInUser = await UserModel.findById(user._id).select(
      '-password -refreshToken -emailVerificationToken -emailVerificationExpiry'
    );

    return {
      message: 'user logged in successfully',
      user: loggedInUser,
      tokens: { accessToken, refreshToken },
    };
  })
);
