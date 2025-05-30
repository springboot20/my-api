import mongoose from "mongoose";
import { AvailableAccountStatus, AvailableCardStatus } from "../../../../constants.js";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { AccountModel, WalletModel, CardModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";

export const deleteUserAccount = apiResponseHandler(
  /**
   *
   * @param {import('express').Request} req
   *
   */
  async (req, res) => {
    const userId = req.user?._id;
    const { accountId } = req.params;

    const accountObjectId = new mongoose.Types.ObjectId(accountId);

    // Get wallet balance
    const wallet = await WalletModel.findOne({
      account: accountObjectId,
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!wallet) {
      throw new CustomErrors(`Wallet not found`, StatusCodes.NOT_FOUND);
    }

    // Check if balance is zero
    if (wallet.balance > 0) {
      throw new CustomErrors(
        `Cannot close account with positive balance: ${wallet.balance} ${wallet.currency}`,
        StatusCodes.BAD_REQUEST
      );
    }

    // Update account status to CLOSED
    const closedAccount = await AccountModel.findOneAndUpdate(
      { _id: accountId, user: userId },
      { status: AvailableAccountStatus.CLOSED },
      { new: true }
    );

    if (!closedAccount) {
      throw new CustomErrors(`Account not found or unauthorized`, StatusCodes.NOT_FOUND);
    }

    // Deactivate wallet
    await WalletModel.findOneAndUpdate(
      { account: accountId, user: userId },
      { isActive: false },
      { new: true }
    );

    // Update associated cards
    if (CardModel) {
      await CardModel.updateMany(
        {
          $or: [{ primary_account: accountId }, { linked_accounts: accountId }],
          user: userId,
        },
        { status: AvailableCardStatus.INACTIVE }
      );
    }

    return new ApiResponse(
      StatusCodes.OK,
      { account: closedAccount },
      "Account closed successfully"
    );
  }
);
