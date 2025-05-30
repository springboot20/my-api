import mongoose from "mongoose";
import { AvailableAccountStatus, AvailableCardStatus } from "../../../../constants.js";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { AccountModel, WalletModel, CardModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";

export const adminDeleteUserAccount = apiResponseHandler(async (req) => {
  const { accountId } = req.params;
  const accountObjectId = new mongoose.Types.ObjectId(accountId);

  // Get wallet balance
  const wallet = await WalletModel.findOne({ account: accountObjectId });

  if (!wallet) {
    throw new CustomErrors(`Wallet not found`, StatusCodes.NOT_FOUND);
  }

  if (wallet.isActive) {
    throw new CustomErrors(`Wallet is still active`, StatusCodes.BAD_REQUEST);
  }

  // Update account status to CLOSED
  const account = await AccountModel.findOne({ _id: accountObjectId });

  if (!account) {
    throw new CustomErrors(`Account not found or unauthorized`, StatusCodes.NOT_FOUND);
  }

  // Update account status to CLOSED
  const closedAccount = await AccountModel.findByIdAndDelete(accountObjectId);

  if (!closedAccount) {
    throw new CustomErrors(`Account not found or unauthorized`, StatusCodes.NOT_FOUND);
  }

  // Deactivate wallet
  await WalletModel.findOneAndDelete({ account: accountObjectId });

  // Update associated cards
  if (CardModel) {
    await CardModel.deleteMany({
      $or: [{ primary_account: accountObjectId }, { linked_accounts: accountObjectId }],
    });
  }

  return new ApiResponse(StatusCodes.OK, {}, "account deleted successfully");
});

export const closeAccount = apiResponseHandler(
  /**
   *
   * @param {import('express').Request} req
   *
   */
  async (req) => {
    const userId = req.user?._id;
    const { accountId } = req.params;

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

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
      { _id: accountObjectId, user: userObjectId },
      { status: AvailableAccountStatus.CLOSED },
      { new: true }
    );

    if (!closedAccount) {
      throw new CustomErrors(`Account not found or unauthorized`, StatusCodes.NOT_FOUND);
    }

    // Deactivate wallet
    await WalletModel.findOneAndUpdate(
      { account: accountObjectId, user: userObjectId },
      { isActive: false },
      { new: true }
    );

    // Update associated cards
    if (CardModel) {
      await CardModel.updateMany(
        {
          $or: [{ primary_account: accountObjectId }, { linked_accounts: accountObjectId }],
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
