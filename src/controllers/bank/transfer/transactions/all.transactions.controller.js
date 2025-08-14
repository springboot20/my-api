import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { StatusCodes } from "http-status-codes";
import { TransactionModel } from "../../../../models/index.js";
import { getMognogoosePagination } from "../../../../utils/index.js";

const getPipelineData = () => {
  return [
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              _id: 1,
              firstname: 1,
              lastname: 1,
            },
          },
        ],
      },
    },

    // lookup for account related to transaction
    {
      $lookup: {
        from: "accounts",
        foreignField: "_id",
        localField: "account",
        as: "account",
        pipeline: [
          {
            $project: {
              account_number: 1,
              type: 1,
              status: 1,
            },
          },
        ],
      },
    },

    // add field for user and account looked up for
    {
      $addFields: {
        user: { $first: "$user" },
        account: { $first: "$account" },
      },
    },
    {
      $unset: "profile",
    },
  ];
};

export const getAllTransactions = apiResponseHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  console.log(req.query);

  const transactions = TransactionModel.aggregate([
    {
      $match: search
        ? {
            description: {
              $regex: search.trim(),
              $options: "i",
            },
          }
        : {},
    },
    ...getPipelineData(),
  ]);

  const paginatedTransactions = await TransactionModel.aggregatePaginate(
    transactions,
    getMognogoosePagination({
      limit,
      page,
      customLabels: {
        totalDocs: "total_transactions",
      },
    })
  );

  return new ApiResponse(
    StatusCodes.OK,
    paginatedTransactions,
    "transactions fetched successfully"
  );
});
