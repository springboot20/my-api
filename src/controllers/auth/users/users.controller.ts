import argon from "argon2";
import {
  ApiResponse,
  apiResponseHandler,
} from "@middleware/api/api.response.middleware.js";
import { mongooseTransactions } from "@middleware/mongoose/mongoose.transactions.js";
import { UserModel } from "@models/index.js";
import { checkPermission } from "@utils/permissions.js";
import { CustomErrors } from "@middleware/custom/custom.errors.js";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

export const getCurrentUser = apiResponseHandler(
  async (req: Request, res: Response) => {
    return new ApiResponse(
      StatusCodes.OK,
      {
        currentUser: req.user,
      },
      "Current user fetched successfully"
    );
  }
);

export const getUsers = apiResponseHandler(
  mongooseTransactions(async (req: Request, res: Response) => {
    const users = await UserModel.find({});

    const user = await UserModel.findById(req.user?._id);
    checkPermission(user, user?._id);

    return new ApiResponse(
      StatusCodes.OK,
      {
        users: users,
      },
      "users fetched successfully"
    );
  })
);

export const updateCurrentUserProfile = apiResponseHandler(
  mongooseTransactions(
    async (
      req: Request,
      res: Response,
      session: mongoose.mongo.ClientSession
    ) => {
      const { password, ...rest } = req.body;
      const { userId } = req.params;

      const hashedPassword = await argon.hash(password);

      const updatedUser = await UserModel.findByIdAndUpdate(
        new mongoose.Schema.ObjectId(userId),
        { $set: { ...rest, password: hashedPassword } },
        { new: true }
      ).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordExpiry -forgotPasswordExpiryToken"
      );

      await updatedUser!.save({ session });

      if (!updatedUser)
        throw new CustomErrors(
          "unable to updated user profile",
          StatusCodes.BAD_REQUEST
        );

      return new ApiResponse(
        StatusCodes.OK,
        {
          user: updatedUser,
        },
        "user updated successfully"
      );
    }
  )
);
