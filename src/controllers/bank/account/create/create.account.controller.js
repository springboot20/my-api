import {
  apiResponseHandler,
  ApiResponse,
} from '../../../../middleware/api/api.response.middleware.js';
import { CustomErrors } from '../../../../middleware/custom/custom.errors.js';
import { mongooseTransactions } from '../../../../middleware/mongoose/mongoose.transactions.js';
import { AccountModel, WalletModel } from '../../../../models/index.js';
import { StatusCodes } from 'http-status-codes';
import AccountService from '../../../../service/account/account.service.js';
import bcrypt from 'bcrypt';

/**
 * Constants for error messages and salt rounds
 */
const ERRORS = {
  ACCOUNT_EXISTS: (type) => `Account type already exists: ${type}`,
  ACCOUNT_EXISTS_CLOSED: (status) => `Account type already exists but: ${status}`,
  ACCOUNT_CREATION: 'Error while creating account',
  WALLET_CREATION: 'Error while creating wallet',
};

const SALT_ROUNDS = 10;

/**
 * Create a new account with associated wallet for a user
 * @param {Object} options - Account creation options
 * @param {Object} options.userData - User data
 * @param {Object} options.accountData - Account data
 * @param {Object} options.walletData - Wallet data
 * @param {Object} session - Mongoose session for transaction
 * @returns {Object} Created account and wallet
 */
const createAccountWithWallet = async ({ userData, accountData, walletData }, session) => {
  // Generate account number and hash pin
  const account_number = await AccountService.createAccountNumber();
  const hashedPin = await bcrypt.hash(accountData.pin, await bcrypt.genSalt(SALT_ROUNDS));

  // Create account
  const newAccount = await AccountModel.create(
    [
      {
        user: userData.userId,
        type: accountData.type,
        account_number,
        pin: hashedPin,
      },
    ],
    { session }
  );

  if (!newAccount?.[0]) {
    throw new CustomErrors(ERRORS.ACCOUNT_CREATION, StatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Create wallet
  const wallet = await WalletModel.create(
    [
      {
        user: userData.userId,
        account: newAccount[0]._id,
        balance: walletData.initialBalance || 0,
        currency: walletData.currency || 'USD',
      },
    ],
    { session }
  );

  if (!wallet?.[0]) {
    throw new CustomErrors(ERRORS.WALLET_CREATION, StatusCodes.INTERNAL_SERVER_ERROR);
  }

  return {
    account: newAccount[0],
    wallet: wallet[0],
  };
};

/**
 * Check if user already has an account of specified type
 * @param {string} userId - User ID
 * @param {string} accountType - Account type
 * @returns {Promise<Object|null>} Existing account or null
 */
const findExistingAccount = async (userId, accountType) => {
  return AccountModel.findOne({ user: userId, type: accountType });
};

export const createAccount = apiResponseHandler(
  mongooseTransactions(
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async (req, res, session) => {
      const { type, initialBalance, currency, pin } = req.body;
      const userId = req.user?._id;

      // Check for existing account
      const existingAccount = await findExistingAccount(userId, type);

      if (existingAccount) {
        if (existingAccount.status === 'CLOSED')
          throw new CustomErrors(
            ERRORS.ACCOUNT_EXISTS_CLOSED(existingAccount.status),
            StatusCodes.CONFLICT
          );
        throw new CustomErrors(ERRORS.ACCOUNT_EXISTS(type), StatusCodes.CONFLICT);
      }

      // Create account and wallet in a transaction
      const result = await createAccountWithWallet(
        {
          userData: { userId },
          accountData: { type, pin },
          walletData: { initialBalance, currency },
        },
        session
      );

      return new ApiResponse(
        StatusCodes.CREATED,
        { account: result },
        'Account successfully created with wallet'
      );
    }
  )
);

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
    isValid ? 'Account number is valid and available' : 'Invalid or already taken account number'
  );
});
