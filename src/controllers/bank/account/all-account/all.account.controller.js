import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { mongooseTransactions } from "../../../../middleware/mongoose/mongoose.transactions.js";
import { AccountModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";

export const getUserAccounts = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('mongoose').ClientSession} session
     */
    async (req, res, session) => {
      const accounts = await AccountModel.find({ user: req.user?._id }).session(session);

      if (!accounts) {
        throw new CustomErrors("no accounts exist for the user", StatusCodes.NOT_FOUND);
      }

      return new ApiResponse(
        StatusCodes.CREATED,
        { accounts },
        "all users account fetched successfull",
      );
    },
  ),
);
