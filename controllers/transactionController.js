const model = require('../model/index');
const customErrors = require('../middleware/customErrors');
const { StatusCodes } = require('http-status-codes');
const { checkPermission } = require('../utils/permissions');
const withTransaction = require('../middleware/mongooseTransaction');
const errorHandler = require('../middleware/errorResponseHandler');
const mongoose = require('mongoose');

const stripeApi = async ({}) => {};

const createTransactionWallet = errorHandler(
  withTransaction(async (req, res, session) => {
    const { user, ...rest } = req.body;
    user = req.user?.userId;

    const transaction = await model.TransactionModel({ ...rest, user });
  })
);

const transactionStatistics = errorHandler(async (req, res) => {
  let statusStats = await model.TransactionModel.aggregate([
    {
      $match: { user: mongoose.Types.ObjectId(req.user.userId) },
    },
    {
      $group: { _id: '$status', count: { $sum: 1 } },
    },
  ]);

  statusStats = statusStats.reduce((acc, stats) => {
    const { _id: status, count } = stats;
    acc[status] = count;
    return acc;
  }, {});

  const defaultStats = {
    pending: statusStats.pending || 0,
    failed: statusStats.failed || 0,
    completed: statusStats.completed || 0,
  };

  let date = new Date();
  let lastYear = new Date(date.setYear(date.getFullYear() - 1));
  let lastMonth = new Date(date.setMonth(date.getMonth() -1));

  let monthlyTransaction = await model.TransactionModel.aggregate([
    { $match: { user: mongoose.Types.ObjectId(req.user?.userId) } },
    {
      $project: {
        year: { $year: '$createdAt', $gte: lastYear },
        month: { $month: '$createdAt', $gte: lastMonth },
      },
    },
    {
      $group: {
        _id: { year: '$year', month: '$month' },
        total: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 10 },
  ]);

  monthlyTransaction = monthlyTransaction.map((item) => {
    const {
      _id: { year, month },
      total,
    } = item;

    const date = moment()
      .month(month - 1)
      .year(year)
      .format('MMM Y');

    return date, total;
  });

  res.status(StatusCodes.OK);
  return monthlyTransaction, defaultStats;
});

module.exports = { createTransactionWallet, transactionStatistics };
