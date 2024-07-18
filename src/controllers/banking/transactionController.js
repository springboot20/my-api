const model = require('../../models/index');
const customErrors = require('../middleware/customErrors');
const { StatusCodes } = require('http-status-codes');
const { checkPermission } = require('../../utils/permissions');
const withTransaction = require('../middleware/mongooseTransaction');
const errorHandler = require('../middleware/errorResponseHandler');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const stripePaymentApi = async ({ stripeOptions }) => {
  const paymentIntents = stripe.paymentIntents.create(stripeOptions);

  return { client_secret: paymentIntents.client_secret };
};

const createTransactionWallet = errorHandler(
  withTransaction(async (req, res, session) => {
    console.log(req.user.userId);
    req.body.user = req.user.userId;

    const transaction = await model.TransactionModel(req.body);
    await transaction.save({ session });

    const payment = await stripePaymentApi({
      stripeOptions: {
        amount: req.body.amount,
        currency: req.body.currency,
      },
    });

    res.status(StatusCodes.CREATED);
    return { transaction, payment };
  })
);

const transactionStatistics = errorHandler(async (req, res, next) => {
  let stats = await model.TransactionModel.aggregate([
    {
      $match: { user: new mongoose.Types.ObjectId(req.user.userId) },
    },
    {
      $group: { _id: '$status', count: { $sum: 1 } },
    },
  ]);

  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    return acc;
  }, {});

  const defaultStats = {
    completed: stats.completed || 0,
    declined: stats.declined || 0,
    pending: stats.pending || 0,
  };

  let date = new Date();
  let lastYear = new Date(date.setYear(date.getFullYear() - 1));
  let lastMonth = new Date(date.setMonth(date.getMonth() - 1));

  let monthlyTransaction = await model.TransactionModel.aggregate([
    {
      $match: {
        createdAt: { $gte: lastMonth, $gte: lastYear },
        user: new mongoose.Types.ObjectId(req.user.userId),
      },
    },
    {
      $project: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        status: { $status: '$status' },
      },
    },
    {
      $group: {
        _id: { year: '$year', month: '$month', status: '$status' },
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
      .format('MMM YYYY');

    return { date, total, defaultStats };
  });

  res.status(StatusCodes.OK);
  return { monthlyTransaction, defaultStats };
});

module.exports = { createTransactionWallet, transactionStatistics };
