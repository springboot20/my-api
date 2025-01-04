import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { TransactionModel } from "../../../../models/index.js";

const getPipelineData = () => {
  return [
    // lookup for user related to a transaction
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "user",
        as: "user",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              email: 1,
              avatar: 1,
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

export const getUserTransactionByType = apiResponseHandler(async (req, res) => {
  const { type, page = 1, limit = 10 } = req.body;

  const transactions = await TransactionModel.aggregate([
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
    ...getPipelineData(),
  ]);

  if (!transactions)
    throw new CustomErrors("failed to fetch transactions", StatusCodes.INTERNAL_SERVER_ERROR);

  return new ApiResponse(StatusCodes.OK, transactions, "transactions fetched successfully");
});
