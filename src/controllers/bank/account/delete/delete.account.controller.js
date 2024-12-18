import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { mongooseTransactions } from "../../../../middleware/mongoose/mongoose.transactions.js";
import { AccountModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";

export const deleteUserAccount = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('mongoose').ClientSession} session
     */
    async (req, res, session) => {
      const { accountId } = req.params;

      const account = await AccountModel.findById(accountId);

      if (!account) throw new CustomErrors("account not found", StatusCodes.NOT_FOUND);

      await AccountModel.findByIdAndDelete(accountId).session(session);

      return new ApiResponse(StatusCodes.OK, {}, "user account deleted successfull");
    },
  ),
);
