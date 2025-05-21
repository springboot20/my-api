import { AvailableAccountStatusEnums } from '../../../../constants.js';
import {
  apiResponseHandler,
  ApiResponse,
} from '../../../../middleware/api/api.response.middleware.js';
import { CustomErrors } from '../../../../middleware/custom/custom.errors.js';
import { AccountModel, WalletModel } from '../../../../models/index.js';
import { StatusCodes } from 'http-status-codes';


/**
* Helper function to update wallet status based on requested account status
* @param {Object} wallet - Wallet document
* @param {String} status - Requested account status
* @returns {Boolean} - Whether wallet was updated and needs saving
*/
const updateWalletStatus = async (wallet, status) => {
 if (!wallet.isActive && status === 'ACTIVE') {
   wallet.isActive = true;
   return true;
 } 
 
 if (wallet.isActive && (status === 'INACTIVE' || status === 'CLOSED')) {
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
  const { status, type } = updates;

  // Validate status value
  if (!AvailableAccountStatusEnums.includes(status)) {
    throw new CustomErrors('Invalid status value', StatusCodes.BAD_REQUEST);
  }

  // Find the wallet
  const wallet = await WalletModel.findOne({ account: accountId, user: userId });
  if (!wallet) {
    throw new CustomErrors('Wallet not found', StatusCodes.NOT_FOUND);
  }

  // Check balance for deactivation/closure if not skipped
  if (!skipBalanceCheck && 
      wallet.isActive && 
      (status === 'INACTIVE' || status === 'CLOSED') && 
      wallet.balance > 0) {
    throw new CustomErrors('Wallet balance still has funds', StatusCodes.BAD_REQUEST);
  }

  // Update wallet if needed
  if (await updateWalletStatus(wallet, status)) {
    await wallet.save();
  }

  // Find and update the account
  const updatedAccount = await AccountModel.findOneAndUpdate(
    { _id: accountId, user: userId },
    { status, type },
    { new: true }
  );

  if (!updatedAccount) {
    throw new CustomErrors('Account not found or unauthorized', StatusCodes.NOT_FOUND);
  }

  return updatedAccount;
};

/**
 * Update account status
 */
export const updateAccountStatus = apiResponseHandler(async (req, res) => {
  const userId = req.user?._id;
  const { accountId } = req.params;
  const { status, type } = req.body;

   const updatedAccount = await handleAccountStatusUpdate(userId, accountId, updates, false);
  
  return new ApiResponse(
    StatusCodes.OK, 
    updatedAccount, 
    `Account status updated to ${status}`
  );
});

/**
 * Update account status
 */
export const adminUpdateAccountStatus = apiResponseHandler(async (req, res) => {
  const userId = req.user?._id;
  const { accountId } = req.params;
  const { status, type } = req.body;

   // Skip balance check for admin operations
  const updatedAccount = await handleAccountStatusUpdate(userId, accountId, updates, true);
  
  return new ApiResponse(
    StatusCodes.OK, 
    updatedAccount, 
    `Account status updated to ${updates.status}`
  );
});
