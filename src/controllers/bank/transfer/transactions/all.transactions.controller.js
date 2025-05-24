import {
  apiResponseHandler,
  ApiResponse,
} from '../../../../middleware/api/api.response.middleware.js';
import { CustomErrors } from '../../../../middleware/custom/custom.errors.js';
import { StatusCodes } from 'http-status-codes';
import { TransactionModel } from '../../../../models/index.js';
import { checkPermissions } from '../../../../utils/permissions.js';
import { RoleEnums } from '../../../../constants.js';
import { getMognogoosePagination } from '../../../../utils/index.js';

const getPipelineData = () => {
  return [
    {
      $lookup: {
        from: 'profiles',
        localField: 'user',
        foreignField: 'user',
        as: 'profile',
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

    // lookup for account related to transaction
    {
      $lookup: {
        from: 'accounts',
        foreignField: '_id',
        localField: 'account',
        as: 'account',
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
        user_profile: { $first: '$profile' },
        account: { $first: '$account' },
      },
    },
    {
      $unset: 'profile',
    },
  ];
};

export const getAllTransactions = apiResponseHandler(async (req, res) => {
  checkPermissions(RoleEnums.ADMIN);

  const { type } = req.body;
  const { page = 1, limit = 10, search } = req.query;

  const transactions = TransactionModel.aggregate([
    {
      $match: type
        ? {
            type: {
              $regex: type.trim(),
              $options: 'i',
            },
          }
        : {},
    },
    {
      $match: search
        ? {
          description: {
              $regex: search.trim(),
              $options: 'i',
            },
          }
        : {},
    },
    ...getPipelineData(),
  ]);

  const paginatedTransactions = await TransactionModel.aggregatePaginate(
    transactions,
    getMognogoosePagination({
      limit,
      page,
      customLabels: {
        totalDocs: 'total_transactions',
      },
    })
  );

  if (!transactions)
    throw new CustomErrors('failed to fetch transactions', StatusCodes.INTERNAL_SERVER_ERROR);

  return new ApiResponse(
    StatusCodes.OK,
    paginatedTransactions,
    'transactions fetched successfully'
  );
});
