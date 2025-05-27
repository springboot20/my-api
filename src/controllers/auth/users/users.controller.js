import bcrypt from "bcrypt";
import {
  ApiResponse,
  apiResponseHandler,
} from "../../../middleware/api/api.response.middleware.js";
import { UserModel } from "../../../models/index.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { getMognogoosePagination } from "../../../utils/index.js";
import mongoose from "mongoose";

export const getCurrentUser = apiResponseHandler(async (req, res) => {
  return new ApiResponse(
    StatusCodes.OK,
    {
      currentUser: req.user,
    },
    "Current user fetched successfully"
  );
});

export const getUserById = apiResponseHandler(async (req, res) => {
  const { userId } = req.query;

  const userAggregate = await UserModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId.createFromTime(userId),
      },
    },
    {
      $lookup: {
        from: "profiles",
        foreignField: "user",
        localField: "_id",
        as: "profile",
        pipeline: [
          {
            $project: {
              firstname: 1,
              lastname: 1,
              present_address: 1,
              country: 1,
              city: 1,
              phoneNumber: 1,
              postal_code: 1,
              timezone: 1,
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
  ]);

  return new ApiResponse(StatusCodes.OK, userAggregate[0], "user details fetched");
});

export const getUsers = apiResponseHandler(async (req, res) => {
  const { limit = 10, page = 1, search } = req.query;
console.log(req.query)
  const usersAggregate = UserModel.aggregate([
    {
      $match: search
        ? {
            role: {
              $regex: search.trim(),
              $options: "i",
            },
          }
        : {},
    },
    {
      $match: search
        ? {
            username: {
              $regex: search.trim(),
              $options: "i",
            },
          }
        : {},
    },
  ]);


  const users = await UserModel.aggregatePaginate(
    usersAggregate,
    getMognogoosePagination({
      limit,
      page,
      customLabels: {
        totalDocs: "users",
      },
    })
  );

  return new ApiResponse(StatusCodes.OK, users, "users fetched successfully");
});

export const updateCurrentUserProfile = apiResponseHandler(async (req, res) => {
  const { password, ...rest } = req.body;

  const salt = await bcrypt.genSalt(20);
  const hashedPassword = await bcrypt.hash(password, salt);

  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        ...rest,
        password: hashedPassword,
      },
    },
    { new: true }
  ).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordExpiry -forgotPasswordExpiryToken"
  );

  await updatedUser.save({ session });

  if (!updatedUser)
    throw new CustomErrors("unable to updated user profile", StatusCodes.BAD_REQUEST);

  return new ApiResponse(
    StatusCodes.OK,
    {
      user: updatedUser,
    },
    "user updated successfully"
  );
});
