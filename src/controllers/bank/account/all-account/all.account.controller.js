import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { mongooseTransactions } from "../../../../middleware/mongoose/mongoose.transactions.js";
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

export const getUserAccounts = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     *
     */
    async (req, res) => {
      const accounts = await AccountModel.aggregate([
        {
          $match: {
            user: req.user?._id,
          },
        },
        ...accountPipeline(),
      ]);

      if (!accounts) {
        throw new CustomErrors("no accounts exist for the user", StatusCodes.NOT_FOUND);
      }

      return new ApiResponse(
        StatusCodes.CREATED,
        { accounts },
        "all users account fetched successfull"
      );
    }
  )
);
