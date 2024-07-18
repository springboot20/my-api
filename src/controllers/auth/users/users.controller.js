import { apiResponseHandler } from '@middleware/api/api.response.middleware';
import { mongooseTransactions } from '@middleware/mongoose/mongoose.transactions';
import { UserModel } from '@models/index';
import { checkPermission } from '@utils/permissions';

export const getCurrentUser = apiResponseHandler(async (req, res) => {
  return {
    message: 'Current user fetched successfully',
    currentUser: req.user,
  };
});

export const getUsers = apiResponseHandler(
  mongooseTransactions(async (req, res) => {
    const users = await UserModel.find({});

    const user = await UserModel.findById(req.user?._id);
    checkPermission(user, user?._id);

    return {
      message: 'users fetched successfully',
      users: users,
    };
  })
);
