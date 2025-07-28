import mongoose from "mongoose";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { AccountModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";

export const getAccountByNumber = apiResponseHandler(async (req, res) => {
  const { account_number } = req.query;

  console.log({ account_number });

  if (!account_number) {
    throw new CustomErrors("Account number is required", StatusCodes.BAD_REQUEST);
  }

  const accountDetails = await AccountModel.aggregate([
    {
      $match: {
        account_number,
      },
    },
    {
      $lookup: {
        from: "profiles",
        localField: "user",
        foreignField: "user",
        as: "profile",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        profile: { $first: "$profile" },
      },
    },
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
    {
      $lookup: {
        from: "wallets",
        let: { accountId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$account", "$$accountId"] }],
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
  ]);

  console.log(accountDetails[0]);

  if (!accountDetails || accountDetails.length === 0) {
    throw new CustomErrors("Account not found", StatusCodes.NOT_FOUND);
  }

  return new ApiResponse(StatusCodes.OK, accountDetails[0], "Account retrieved successfully");
});

export const getAccountDetailById = apiResponseHandler(async (req, res) => {
  const { accountId } = req.params;

  console.log({ accountId });

  // Convert string ID to ObjectId if needed
  const objectId = new mongoose.Types.ObjectId(accountId);

  const accountDetails = await AccountModel.aggregate([
    {
      $match: {
        _id: objectId,
      },
    },
    {
      $lookup: {
        from: "profiles",
        localField: "user",
        foreignField: "user",
        as: "profile",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        profile: { $first: "$profile" },
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
              firstname: 1,
              lastname: 1,
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
                $and: [{ $eq: ["$account", "$$accountId"], $eq: ["$user", "$user"] }],
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

  console.log(accountDetails[0]);

  return new ApiResponse(
    StatusCodes.OK,
    accountDetails[0],
    "Account details retrieved successfully"
  );
});

export const adminGetAccountDetails = apiResponseHandler(async (req, res) => {
  const { userId, accountId } = req.params;

  // Convert string ID to ObjectId if needed
  const objectId = new mongoose.Types.ObjectId(accountId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const accountDetails = await AccountModel.aggregate([
    {
      $match: {
        _id: objectId,
        user: userObjectId,
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
              firstname: 1,
              lastname: 1,
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
