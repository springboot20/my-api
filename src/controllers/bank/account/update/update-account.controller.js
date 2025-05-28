import { AvailableAccountStatusEnums, AvailableRequestStatusEnums } from "../../../../constants.js";
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
const updateWalletStatus = async (wallet, status, currency) => {
  if (currency) {
    wallet.currency = currency;

    if (wallet.balance) {
      wallet.balance = currency === "USD" ? wallet.balance * 0.0006214 : wallet.balance * 1609.4;
    }
  }

  if (!wallet.isActive && status === "ACTIVE") {
    wallet.isActive = true;
    return true;
  }

  if (wallet.isActive && (status === "INACTIVE" || status === "CLOSED")) {
    wallet.isActive = false;
    return true;
  }

  return false;
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
  if (!AvailableAccountStatusEnums.includes(status)) {
    throw new CustomErrors("Invalid status value", StatusCodes.BAD_REQUEST);
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
    AvailableAccountStatusEnums.includes(status) &&
    status !== "ACTIVE" &&
    wallet.balance > 0
  ) {
    throw new CustomErrors("Wallet balance still has funds", StatusCodes.BAD_REQUEST);
  }

  // Update wallet if needed
  if (updateWalletStatus(wallet, status, currency)) {
    await wallet.save();
  }

  // Find and update the account
  const updatedAccount = await AccountModel.findOneAndUpdate(
    { _id: accountId, user: userId },
    { status, type, currency },
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
  const updates = { status, type, currency };

  const updatedAccount = await handleAccountStatusUpdate(userId, accountId, updates, false);

  return new ApiResponse(StatusCodes.OK, updatedAccount, `Account status updated to ${status}`);
});

/**
 * Update account status
 */
export const adminUpdateAccountStatus = apiResponseHandler(async (req, res) => {
  const { accountId } = req.params;
  const { status, type, userId } = req.body;
  const updates = { status, type };

  if (!AvailableRequestStatusEnums) {
    throw new CustomErrors("invalid status", StatusCodes.BAD_REQUEST);
  }

  // Skip balance check for admin operations
  const updatedAccount = await handleAccountStatusUpdate(userId, accountId, updates, true);

  return new ApiResponse(StatusCodes.OK, updatedAccount, `Account status updated to ${status}`);
});
