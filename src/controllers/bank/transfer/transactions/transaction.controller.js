import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { StatusCodes } from "http-status-codes";
import { TransactionModel } from "../../../../models/index.js";
import mongoose from "mongoose";

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

export const getTransactionById = apiResponseHandler(async (req, res) => {
  const { transactionId } = req.query;

  const transactionDetails = await TransactionModel.aggregate([
    {
      $match: {
        user: req.user?._id,
      },
    },
    {
      $match: transactionId
        ? {
            _id: new mongoose.Types.ObjectId(transactionId),
          }
        : {},
    },
    ...getPipelineData(),
  ]);

  if (!transactionDetails) {
    throw new CustomErrors("failed to fetch transaction details.", StatusCodes.BAD_REQUEST);
  }

  return new ApiResponse(
    StatusCodes.OK,
    transactionDetails[0],
    "transaction details fetched successfully"
  );
});
