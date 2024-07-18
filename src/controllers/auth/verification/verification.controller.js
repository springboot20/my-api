import { apiResponseHandler } from '@middleware/api/api.response.middleware';
import { mongooseTransactions } from '@middleware/mongoose/mongoose.transactions';
import { UserModel } from '@models/index';
import { NotFound, UnAuthorized, Conflict } from '@middleware/custom/custom.errors';
import { validateToken } from '@utils/jwt';

export const forgotPassword = apiResponseHandler(
  mongooseTransactions(async (req, res, session) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) throw new NotFound('User not found');

    const { unHashedToken, hashedToken, token } = user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordTokenExpiry = token;
    await user.save({ validateBeforeSave: false });
    
    const resetLink = `${req.protocol}//:${req.get(
      'host'
    )}/api/v1/user/reset-password/${unHashedToken}`;
    // await sendMail(user.email, 'Password reset', { resetLink, username: user.username }, 'reset-password');

    await user.save({ validateBeforeSave: false, session });
    return { message: 'Password reset link sent to your email' };
  })
);

export const refreshToken = apiResponseHandler(
  mongooseTransactions(async (req, res, session) => {
    const {
      body: { inComingRefreshToken },
    } = req;

    try {
      const decodedRefreshToken = validateToken(
        inComingRefreshToken,
        process.env.JWT_REFRESH_SECRET
      );
      let user = await UserModel.findByIdAndUpdate(decodedRefreshToken?._id);

      if (!user) {
        throw new UnAuthorized('Invalid Token');
      }

      if (inComingRefreshToken !== user?.refreshToken) {
        throw new UnAuthorized('Token has expired or has already been used');
      }

      const { accessToken, refreshToken } = await generateTokens(res, user?._id.toString());
      user.refreshToken = refreshToken;
      await user.save({ session });

      return {
        message: 'access token refreshed successfully',
        tokens: { accessToken, refreshToken },
      };
    } catch (error) {
      return new UnAuthorized(`Error : ${error}`);
    }
  })
);

export const verifyEmail = apiResponseHandler(
  mongooseTransactions(async (req, res) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) throw new NotFound('User not found');

    const { unHashedToken, hashedToken, token } = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = token;

    const verifyLink = `${req.protocol}//:${req.get(
      'host'
    )}/api/v1/users/verify-email/${unHashedToken}`;
    // await sendMail(user.email, 'Password reset', { verifyLink, username: user.username }, 'verify-email');

    await user.save({ validateBeforeSave: false, session });
    return { message: 'password reset link sent to your email' };
  })
);

export const resendEmailVerification = apiResponseHandler(
  mongooseTransactions(async (req, res) => {
    const user = await UserModel.findById(req.user?._id);

    if (!user) throw new NotFound('User not found');
    if (user.isEmailVerified) throw new Conflict('Email has already been verified');

    const { unHashedToken, hashedToken, token } = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = token;
  await user.save({ validateBeforeSave: false });

    const verifyLink = `${req.protocol}//:${req.get(
      'host'
    )}/api/v1/users/verify-email/${unHashedToken}`;
    // await sendMail(user.email, 'Password reset', { verifyLink, username: user.username }, 'verify-email');

    await user.save({ validateBeforeSave: false, session });
    return { message: 'email verification link sent to your email' };
  })
);
