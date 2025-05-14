import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { mongooseTransactions } from "../../../../middleware/mongoose/mongoose.transactions.js";
import { AccountModel, WalletModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";
import AccountService from "../../../../service/account/account.service.js";

export const createAccount = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     *
     */
    async (req, res) => {
      const { type, initialBalance, currency, account_number } = req.body;

      const userId = req?.user?._id;
      const existingAccount = await AccountModel.findOne({ user: req.user?._id, type });

      if (existingAccount) {
        throw new CustomErrors(`account type already exists ${type}`, StatusCodes.CONFLICT);
      }

      const newAccount = await AccountModel.create({
        user: userId,
        type,
        account_number,
      });

      if (!newAccount) {
        throw new CustomErrors(`error while creating account`, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      const wallet = await WalletModel.create({
        user: userId,
        account: newAccount._id,
        balance: initialBalance || 0,
        currency: currency || "USD",
      });

      if (!wallet) {
        // Rollback account creation
        await AccountModel.findByIdAndDelete(newAccount._id);
        throw new CustomErrors(`Error while creating wallet`, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      return new ApiResponse(
        StatusCodes.CREATED,
        { account: newAccount, wallet },
        "Account successfully created with wallet"
      );
    }
  )
);

export const generateAccountNumber = apiResponseHandler(async () => {
  const account_number = await AccountService.createAccountNumber();

  return new ApiResponse(
    StatusCodes.CREATED,
    { account_number },
    "cccount number generated successfully"
  );
});

/**
 * Validate account number format and uniqueness
 */
export const validateAccountNumber = apiResponseHandler(async (req, res) => {
  const { accountNumber } = req.body;

  // Validate format and uniqueness
  const isValid = await AccountService.isAccountNumberValid(accountNumber);

  return new ApiResponse(
    StatusCodes.OK,
    { isValid, accountNumber },
    isValid ? "Account number is valid and available" : "Invalid or already taken account number"
  );
});
