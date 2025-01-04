import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { mongooseTransactions } from "../../../../middleware/mongoose/mongoose.transactions.js";
import { AccountModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";

export const getUserAccount = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     *
     */
    async (req, res) => {
      const { type } = req.body;

      const account = await AccountModel.findOne({
        user: req?.user?._id,
        type,
      });

      if (!account) {
        throw new CustomErrors("account does not exist", StatusCodes.NOT_FOUND);
      }

      return new ApiResponse(StatusCodes.CREATED, { account }, "user account fetched successfull");
    }
  )
);
