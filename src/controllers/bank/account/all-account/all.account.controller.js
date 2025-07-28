import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { mongooseTransactions } from "../../../../middleware/mongoose/mongoose.transactions.js";
import { AccountModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";
import { getMognogoosePagination } from "../../../../utils/index.js";

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
      const userId = req.user?._id;
      const { page = 1, limit = 10 } = req.query;

      const accountsAggregation = AccountModel.aggregate([
        {
          $match: {
            user: userId,
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
            from: "profiles",
            foreignField: "user",
            localField: "user",
            as: "profile",
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
        {
          $lookup: {
            from: "wallets",
            foreignField: "account",
            localField: "_id",
            as: "wallet",
          },
        },
        {
          $addFields: {
            profile: { $first: "$profile" },
            wallet: { $first: "$wallet" },
          },
        },
      ]);

      if (!accountsAggregation) {
        throw new CustomErrors("no accounts exist for the user", StatusCodes.NOT_FOUND);
      }

      const paginated_accounts = await AccountModel.aggregatePaginate(
        accountsAggregation,
        getMognogoosePagination({
          page,
          limit,
          customLabels: {
            totalDocs: "total_users",
            // docs: 'accounts',
          },
        })
      );

      return new ApiResponse(
        StatusCodes.CREATED,
        paginated_accounts,
        "all users account fetched successfull"
      );
    }
  )
);

export const getUsersAccounts = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     *
     */
    async (req, res) => {
      const { page = 1, limit = 10, search } = req.query;

      const accountsAggregation = AccountModel.aggregate([
        {
          $match: search
            ? {
                $or: [
                  { "user.firsname": { $regex: search, $options: "i" } },
                  { "user.lastname": { $regex: search, $options: "i" } },
                  { "user.email": { $regex: search, $options: "i" } },
                ],
              }
            : {},
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
            from: "profiles",
            foreignField: "user",
            localField: "user",
            as: "profile",
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
        {
          $lookup: {
            from: "wallets",
            foreignField: "account",
            localField: "_id",
            as: "wallet",
          },
        },
        {
          $addFields: {
            profile: { $first: "$profile" },
            wallet: { $first: "$wallet" },
          },
        },
      ]);

      if (!accountsAggregation) {
        throw new CustomErrors("no accounts exist for the user", StatusCodes.NOT_FOUND);
      }

      const paginated_accounts = await AccountModel.aggregatePaginate(
        accountsAggregation,
        getMognogoosePagination({
          page,
          limit,
          customLabels: {
            totalDocs: "accounts_count",
            // docs: 'accounts',
          },
        })
      );

      return new ApiResponse(
        StatusCodes.CREATED,
        paginated_accounts,
        "all users account fetched successfull"
      );
    }
  )
);
