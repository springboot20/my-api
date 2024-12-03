import {
  apiResponseHandler,
  ApiResponse,
} from "../../middleware/api/api.response.middleware.js";
import { TransactionModel } from "../../models/index.js";
import { StatusCodes } from "http-status-codes";
import { mongooseTransactions } from "../../middleware/mongoose/mongoose.transactions.js";

let matchStage = (id) => ({
  $match: {
    user: id,
  },
});

let weeklyTransaction = {
  weekly: [
    {
      $group: {
        _id: {
          week: {
            $week: "$createdAt",
          },
          year: {
            $year: "$createdAt",
          },
          transaction_type: "$type",
        },
        totalAmount: {
          $sum: "$amount",
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": -1,
        "_id.week": -1,
      },
    },
  ],
};

let monthlyTransaction = {
  monthly: [
    {
      $group: {
        _id: {
          month: {
            $month: "$createdAt",
          },
          year: {
            $year: "$createdAt",
          },
          transaction_type: "$type",
        },
        totalAmount: {
          $sum: "$amount",
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": -1,
        "_id.month": -1,
      },
    },
  ],
};

let yearlyTransaction = {
  weekly: [
    {
      $group: {
        _id: {
          year: {
            $year: "$createdAt",
          },
          transaction_type: "$type",
        },
        totalAmount: {
          $sum: "$amount",
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": -1,
      },
    },
  ],
};

export const userTransactionsOverview = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('mongoose').ClientSession} session
     */
    async (req, res, session) => {
      const statistics = await TransactionModel.aggregate([
        ...matchStage(req.user?._id),
        {
          $facet: {
            weeklyTransaction,
            monthlyTransaction,
            yearlyTransaction,
          },
        },
      ]).session(session);

      return new ApiResponse(StatusCodes.OK, { statistics }, "user transaction statistics fetched");
    },
  ),
);

export const adminTransactionOverview = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('mongoose').ClientSession} session
     */
    async (req, res, session) => {
      const statistics = await TransactionModel.aggregate([
        {
          $match: {},
        },
        {
          $facet: {
            weeklyTransaction,
            monthlyTransaction,
            yearlyTransaction,
          },
        },
      ]).session(session);

      return new ApiResponse(StatusCodes.OK, { statistics }, "transaction statistics fetched");
    },
  ),
);
