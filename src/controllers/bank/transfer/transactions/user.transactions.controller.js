import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { StatusCodes } from "http-status-codes";
import { TransactionModel } from "../../../../models/index.js";
import { getMognogoosePagination } from "../../../../utils/index.js";

const getPipelineData = () => {
  return [
    // lookup for user related to a transaction
    {
      $lookup: {
        from: "profiles",
        foreignField: "user",
        localField: "user",
        as: "user",
        pipeline: [
          {
            $project: {
              _id: 1,
              fisrtname: 1,
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
  ];
};

export const getUserTransactionsByType = apiResponseHandler(async (req, res) => {
  const { type, search, page = 1, limit = 10 } = req.query;

  const transactionsAggregate = TransactionModel.aggregate([
    {
      $match: {
        user: req.user?._id,
      },
    },
    {
      $match: type
        ? {
            type: {
              $regex: type.trim(),
              $options: "i",
            },
          }
        : {},
    },
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

  const paginatedTransactionsAggregate = await TransactionModel.aggregatePaginate(
    transactionsAggregate,
    getMognogoosePagination({
      limit,
      page,
      customLabels: {
        totalDocs: "transactions",
      },
    })
  );

  return new ApiResponse(
    StatusCodes.OK,
    paginatedTransactionsAggregate,
    "transactions fetched successfully"
  );
});
