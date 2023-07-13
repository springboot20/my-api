const model = require('../model/index.js');
const errorHandler = require('../middleware/errorResponseHandler.js');
const { checkPermission } = require('../utils/permissions');
const { StatusCodes } = require('http-status-codes');
const customErrors = require('../middleware/customErrors.js');
const bcrypt = require('bcryptjs');
const withTransaction = require('../middleware/mongooseTransaction');
const moment = require('moment');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

const currentUser = errorHandler(async (req, res) => {
  const user = await model.UserModel.findById(req.user?.userId);
  if (!user) throw customErrors.NotFound('User not found');

  res.status(StatusCodes.OK);
  return user;
});

const getUsers = errorHandler(async (req, res) => {
  const users = await model.UserModel.find({ role: 'user' }).select('-password');
  res.status(StatusCodes.OK);
  return users;
});

const getSingleUser = errorHandler(async (req, res) => {
  const { id: userId } = req.params;

  const user = await model.UserModel.findOne({ _id: userId }).select('-password');
  if (user && user._id) {
    checkPermission(req.user, user._id);
  }
  res.status(StatusCodes.OK);
  return user;
});

const updateUser = errorHandler(
  withTransaction(async (req, res, session) => {
    const { id: userId } = req.params;
    const { password, ...rest } = req.body;

    if (req.body.password) {
      req.body.password = await hashPassword(req.body.password);
    }
    const user = await model.UserModel.findByIdAndUpdate(userId, { $set: { ...rest, password } }, { new: true });
    await user.save({ session });

    res.status(StatusCodes.OK);
    return user;
  })
);

const userStats = errorHandler(async (req, res) => {
  const date = new Date();
  let lastMonth = new Date(date.setMonth(date.getMonth() - 1));
  let lastYear = new Date(date.setYear(date.getFullYear() - 1));

  let monthlyStats = await model.UserModel.aggregate([
    { $match: { createdAt: { $gte: lastMonth, $gte: lastYear } } },
    {
      $project: {
        month: { $month: '$createdAt' },
        year: { $year: '$createdAt' },
      },
    },
    {
      $group: {
        _id: { month: '$month', year: '$year' },
        totalUser: { $sum: 1 },
      },
    },
    { $sort: { '_id.month': -1, '_id.year': -1 } },
    { $limit: 6 },
  ]);

  monthlyStats = monthlyStats
    .map((item) => {
      const {
        _id: { year, month },
        totalUser,
      } = item;
      const date = moment()
        .month(month - 1)
        .year(year - 1)
        .format('MMM YYYY');
      return { date, totalUser };
    })
    .reverse();

  console.log(monthlyStats);
  res.status(StatusCodes.OK);
  return { monthlyStats };
});

module.exports = {
  updateUser,
  currentUser,
  getUsers,
  getSingleUser,
  userStats,
};
