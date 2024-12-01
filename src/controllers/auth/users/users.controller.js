import bcrypt from "bcrypt";
import {
  ApiResponse,
  apiResponseHandler,
} from "../../../middleware/api/api.response.middleware.js";
import { mongooseTransactions } from "../../../middleware/mongoose/mongoose.transactions.js";
import { UserModel } from "../../../models/index.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";

export const getCurrentUser = apiResponseHandler(async (req, res) => {
  return new ApiResponse(
    StatusCodes.OK,
    {
      currentUser: req.user,
    },
    "Current user fetched successfully",
  );
});

export const getUsers = apiResponseHandler(
  mongooseTransactions(async (req, res) => {
    const users = await UserModel.find({});

    return new ApiResponse(
      StatusCodes.OK,
      {
        users: users,
      },
      "users fetched successfully",
    );
  }),
);

export const updateCurrentUserProfile = apiResponseHandler(async (req, res, session) => {
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
    { new: true },
  ).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordExpiry -forgotPasswordExpiryToken",
  );

  await updatedUser.save({ session });

  if (!updatedUser)
    throw new CustomErrors("unable to updated user profile", StatusCodes.BAD_REQUEST);

  return new ApiResponse(
    StatusCodes.OK,
    {
      user: updatedUser,
    },
    "user updated successfully",
  );
});
