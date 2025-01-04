import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { AccountModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";

const accountPipeline = () => {
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
    {
      $lookup: {
        from: "profiles",
        localField: "user._id",
        foreignField: "user",
        as: "profile",
      },
    },
    {
      $addFields: {
        profile: { $first: "$profile" },
      },
    },
  ];
};

export const getUserAccount = apiResponseHandler(
  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   *
   */
  async (req, res) => {
    const { type } = req.body;

    const account = await AccountModel.aggregate([
      {
        $match: {
          user: req?.user?._id,
        },
      },
      {
        $match: type
          ? {
              type: {
                $regex: type.trim(),
                option: "i",
              },
            }
          : {},
      },
      ...accountPipeline(),
    ]);

    if (!account) {
      throw new CustomErrors("account does not exist", StatusCodes.NOT_FOUND);
    }

    return new ApiResponse(
      StatusCodes.CREATED,
      { account: account[0] },
      "user account fetched successfully"
    );
  }
);
