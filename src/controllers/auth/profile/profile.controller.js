import { StatusCodes } from 'http-status-codes';
import {
  apiResponseHandler,
  ApiResponse,
} from '../../../middleware/api/api.response.middleware.js';
import { CustomErrors } from '../../../middleware/custom/custom.errors.js';
import { ProfileModel } from '../../../models/index.js';

const getProfile = () => {
  return [
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          {
            $project: {
              _id: 1,
              avatar: 1,
              email: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        user: { $first: '$user' },
      },
    },
  ];
};

export const createUserProfile = apiResponseHandler(async (req, res) => {
  const {
    firstname,
    lastname,
    phoneNumber,
    present_address,
    permanent_address,
    city,
    country,
    postal_code,
    preferred_view,
  } = req.body;

  const userProfile = await ProfileModel.findOneAndUpdate(
    {
      user: req?.user._id,
    },
    {
      $set: {
        firstname,
        lastname,
        phoneNumber,
        present_address,
        permanent_address,
        city,
        country,
        postal_code,
        preferred_view,
      },
    },
    { new: true }
  );

  if (!userProfile)
    throw new CustomErrors(
      'Error while trying to update user profile',
      StatusCodes.INTERNAL_SERVER_ERROR
    );

  return new ApiResponse(StatusCodes.OK, userProfile, 'User profile updated successfully');
});

export const getUserProfile = apiResponseHandler(async (req, res) => {
  const profile = await ProfileModel.aggregate([
    {
      $match: {
        user: req?.user?._id,
      },
    },
    ...getProfile(),
  ]);

  const _profile = profile[0];

  return new ApiResponse(
    StatusCodes.OK,
    { profile: _profile },
    'user profile fetched successfully'
  );
});
