import { apiResponseHandler } from '@middleware/api/api.response.middleware';
import { mongooseTransactions } from '@middleware/mongoose/mongoose.transactions';
import { UserModel } from '@models/index';

export const logout = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {mongoose.Session} session
     * @returns
     */
    async (req, res, session) => {
      await UserModel.findOneAndUpdate(
        { _id: req.user._id },
        {
          $set: {
            refreshToken: undefined,
          },
        },
        { new: true }
      );

      await UserModel.save({ session });
      return { message: 'you have successfully logged out' };
    }
  )
);
