import { apiResponseHandler } from '@middleware/api/api.response.middleware';
import { Conflict } from '@middleware/custom/custom.errors';
import { mongooseTransactions } from '@middleware/mongoose/mongoose.transactions';
import { UserModel } from '@models/index';

export const register = apiResponseHandler(
  mongooseTransactions(async (req, res, session) => {
    const { email, password, username, role } = req.body;

    const existingUser = await UserModel.findOne({ $or: [{ email }, { password }] });

    if (existingUser) throw new Conflict('user with username or email already exists');

    const user = await UserModel.create({
      username,
      email,
      password,
      role: role || 'user',
      isEmailVerified: false,
    });

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryTokens();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    const verificationLink = `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${
      user?._id
    }/${unHashedToken}`;

    await user.save({ validateBeforeSave: false });

    return {
      message: 'user successfully created',
      user: createdUser,
    };
  })
);
