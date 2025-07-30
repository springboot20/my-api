import { StatusCodes } from "http-status-codes";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { ProfileModel, UserModel } from "../../../models/index.js";
import mongoose from "mongoose";

const getProfile = () => {
  return [
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              _id: 1,
              avatar: 1,
              email: 1,
              firstname: 1,
              lastname: 1,
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
  ];
};

export const createUserProfile = apiResponseHandler(async (req, res) => {
  const {
    username,
    firstname,
    lastname,
    present_address,
    permanent_address,
    city,
    country,
    postal_code,
    preferred_view,
    currency,
    timezone,
  } = req.body;

  console.log(req.body);

  const objectId = new mongoose.Types.ObjectId(req?.user._id);

  const userProfile = await ProfileModel.findOneAndUpdate(
    {
      userId: objectId,
    },
    {
      $set: {
        username,
        present_address,
        permanent_address,
        city,
        country,
        postal_code,
        preferred_view,
        currency,
        timezone,
      },
    },
    { new: true }
  );

  if (!userProfile)
    throw new CustomErrors(
      "Error while trying to updating user profile",
      StatusCodes.INTERNAL_SERVER_ERROR
    );

  const user = await UserModel.findByIdAndUpdate(
    objectId,
    {
      $set: {
        firstname,
        lastname,
      },
    },
    { new: true }
  );

  if (!user)
    throw new CustomErrors(
      "Error while trying to updating user details",
      StatusCodes.INTERNAL_SERVER_ERROR
    );

  return new ApiResponse(StatusCodes.OK, userProfile, "User profile updated successfully");
});

export const getUserProfile = apiResponseHandler(async (req, res) => {
  const profile = await ProfileModel.aggregate([
    {
      $match: {
        userId: req?.user?._id,
      },
    },
    ...getProfile(),
  ]);

  const _profile = profile[0];

  return new ApiResponse(
    StatusCodes.OK,
    { profile: _profile },
    "user profile fetched successfully"
  );
});
