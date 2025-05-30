import mongoose from "mongoose";
import { AvailableAccountStatusEnums } from "../../../../constants.js";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { AccountModel, WalletModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";

/**
 * Helper function to update wallet status based on requested account status
 * @param {Object} wallet - Wallet document
 * @param {String} status - Requested account status
 * @param {String} currency - Requested account status
 * @returns {Boolean} - Whether wallet was updated and needs saving
 */
const updateWalletStatus = (wallet, status, currency) => {
  // Remove async
  let hasChanges = false;

  if (currency) {
    wallet.currency = currency;

    if (wallet.balance) {
      wallet.balance = currency === "USD" ? wallet.balance * 0.0006214 : wallet.balance * 1609.4;
    }
    hasChanges = true; // Mark that changes were made
  }

  if (!wallet.isActive && (status === "ACTIVE" || status === "UNSUSPEND")) {
    wallet.isActive = true;
    hasChanges = true;
  }

  if (wallet.isActive && (status === "INACTIVE" || status === "CLOSE" || status === "SUSPEND")) {
    wallet.isActive = false;
    hasChanges = true;
  }

  return hasChanges; // Always return whether changes were made
};

/**
 * Core function to handle account status updates
 * @param {String} userId - User ID
 * @param {String} accountId - Account ID
 * @param {Object} updates - Update data including status and type
 * @param {Boolean} skipBalanceCheck - Whether to skip balance check when deactivating
 * @returns {Object} - Updated account
 */
const handleAccountStatusUpdate = async (userId, accountId, updates, skipBalanceCheck = false) => {
  const { status, type, currency } = updates;

  // Validate status value
  if (!status) {
    throw new CustomErrors("status value is required", StatusCodes.BAD_REQUEST);
  }

  // Find the wallet
  const wallet = await WalletModel.findOne({ account: accountId, user: userId });
  if (!wallet) {
    throw new CustomErrors("Wallet not found", StatusCodes.NOT_FOUND);
  }

  // Check balance for deactivation/closure if not skipped
  if (
    !skipBalanceCheck &&
    wallet.isActive &&
    // AvailableAccountStatusEnums.includes(status) &&
    status !== "ACTIVE" &&
    wallet.balance > 0
  ) {
    throw new CustomErrors("Wallet balance still has funds", StatusCodes.BAD_REQUEST);
  }

  // Handle wallet updates
  let walletNeedsSave = false;

  // Handle currency conversion
  if (currency && currency !== wallet.currency) {
    wallet.currency = currency;

    if (wallet.balance) {
      wallet.balance = currency === "USD" ? wallet.balance * 0.0006214 : wallet.balance * 1609.4;
    }
    walletNeedsSave = true;
  }

  if (!wallet.isActive && status === "ACTIVE") {
    wallet.isActive = true;
    walletNeedsSave = true;
  }

  if (wallet.isActive && (status === "INACTIVE" || status === "CLOSED")) {
    wallet.isActive = false;
    walletNeedsSave = true;
  }

  // Save wallet if changes were made
  if (walletNeedsSave) {
    await wallet.save();
  }

  // Map CLOSE to CLOSED for account status
  const accountStatus = status === "CLOSE" ? "CLOSED" : status;

  // Find and update the account
  const updatedAccount = await AccountModel.findOneAndUpdate(
    { _id: accountId, user: userId },
    {
      status: accountStatus,
      type,
      currency,
    },
    { new: true }
  );

  if (!updatedAccount) {
    throw new CustomErrors("Account not found or unauthorized", StatusCodes.NOT_FOUND);
  }

  return updatedAccount;
};

/**
 * Update account status
 */
export const updateAccountStatus = apiResponseHandler(async (req, res) => {
  const userId = req.user?._id;
  const { accountId } = req.params;
  const { status, type, currency } = req.body;

  const accountObjectId = new mongoose.Types.ObjectId(accountId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const updatedAccount = await handleAccountStatusUpdate(
    userObjectId,
    accountObjectId,
    { status, type, currency },
    false
  );

  return new ApiResponse(StatusCodes.OK, updatedAccount, `Account status updated to ${status}`);
});

/**
 * Update account status
 */
export const adminUpdateAccountStatus = apiResponseHandler(async (req, res) => {
  const { userId, accountId } = req.params;
  const { status, type, currency } = req.body;

  // Validate status value
  if (!status) {
    throw new CustomErrors("status value is required", StatusCodes.BAD_REQUEST);
  }

  const accountObjectId = new mongoose.Types.ObjectId(accountId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Use the core function
  const updatedAccount = await handleAccountStatusUpdate(
    userObjectId,
    accountObjectId,
    { status, type, currency },
    false // Don't skip balance check for admin updates
  );

  const finalStatus = status === "CLOSE" ? "CLOSED" : status;
  return new ApiResponse(
    StatusCodes.OK,
    updatedAccount,
    `Account status updated to ${finalStatus}`
  );
});
