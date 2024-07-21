import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  apiResponseHandler,
  ApiResponse,
} from "@middleware/api/api.response.middleware.js";
import { mongooseTransactions } from "@middleware/mongoose/mongoose.transactions.js";
import { UserModel } from "@models/index.js";

export const logout = apiResponseHandler(
  mongooseTransactions(
    async (
      req: Request,
      res: Response
    ) => {
      await UserModel.findOneAndUpdate(
        { _id: req.user!._id },
        {
          $set: {
            refreshToken: undefined,
          },
        },
        { new: true }
      );

      return new ApiResponse(
        StatusCodes.OK,
        {},
        "you have successfully logged out"
      );
    }
  )
);
