import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { mongooseTransactions } from "../../../../middleware/mongoose/mongoose.transactions.js";
import { AccountModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";
import AccountService from "../../../../service/account/account.service.js";
import { AvailableAccountStatus } from "../../../../constants.js";

export const createAccount = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('mongoose').ClientSession} session
     */
    async (req, res, session) => {
      const { type } = req.body;

      const existingAccount = await AccountModel.findOne({ user: req.user?._id, type }).session(
        session,
      );

      if (existingAccount) {
        throw new CustomErrors(`account type already exists ${type}`, StatusCodes.CONFLICT);
      }

      const newAccount = await AccountModel.create({
        user: req.user?._id,
        type,
        account_number: await AccountService.createAccountNumber(),
        status: AvailableAccountStatus.ACTIVE,
      });

      if (!newAccount) {
        throw new CustomErrors(`error while creating account`, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      return new ApiResponse(
        StatusCodes.CREATED,
        { account: newAccount },
        "you have successfull created an account",
      );
    },
  ),
);
