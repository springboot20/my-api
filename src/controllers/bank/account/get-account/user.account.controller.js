import mongoose from "mongoose";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { AccountModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";

export const getAccountDetails = apiResponseHandler(async (req, res) => {
  const userId = req.user?._id;
  const { accountId } = req.params;

  // Convert string ID to ObjectId if needed
  const objectId = new mongoose.Types.ObjectId(accountId);

  const accountDetails = await AccountModel.aggregate([
    {
      $match: {
        _id: objectId,
        user: userId,
      },
    },
    // Get user details
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
              username: 1,
              avatar: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        user: { $first: "$user" },
      },
    },
    // Get wallet details
    {
      $lookup: {
        from: "wallets",
        let: { accountId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$account", "$$accountId"] }, { $eq: ["$user", userId] }],
              },
            },
          },
        ],
        as: "wallet",
      },
    },
    {
      $addFields: {
        wallet: { $first: "$wallet" },
      },
    },
    // Get card details
    {
      $lookup: {
        from: "cards",
        let: { accountId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$primary_account", "$$accountId"] },
                  { $in: ["$$accountId", "$linked_accounts"] },
                ],
              },
            },
          },
          {
            $project: {
              cvv: 0, // Exclude sensitive data
            },
          },
        ],
        as: "cards",
      },
    },
  ]);

  if (!accountDetails || accountDetails.length === 0) {
    throw new CustomErrors("Account not found or unauthorized", StatusCodes.NOT_FOUND);
  }

  return new ApiResponse(
    StatusCodes.OK,
    accountDetails[0],
    "Account details retrieved successfully"
  );
});
