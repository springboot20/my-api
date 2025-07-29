import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import {
  AccountModel,
  TransactionModel,
  UserModel,
  WalletModel,
} from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";
import PaymentService from "../../../../service/payment/payment.service.js";
import {
  AvailableTransactionTypes,
  PaymentMethods,
  PaymentStatuses,
} from "../../../../constants.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

export const initiatePaystackDepositTransaction = apiResponseHandler(
  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async (req, res) => {
    const { amount, channel, description, currency } = req.body;

    const user = await UserModel.findById(req.user?._id);

    if (!user) throw new CustomErrors("user not found", StatusCodes.NOT_FOUND);

    const depositInfo = await PaymentService.initializePaystackPayment({
      email: user.email,
      amount,
      channel,
      currency,
    });

    if (depositInfo?.status !== true || !depositInfo.data) {
      throw new CustomErrors("Failed to initialize deposit", StatusCodes.BAD_REQUEST);
    }

    const transaction = await TransactionModel.create({
      reference: depositInfo.data.reference,
      user: req.user._id,
      amount,
      description,
      currency,
      type: AvailableTransactionTypes.DEPOSIT,
      detail: {
        gateway: PaymentMethods.PAYSTACK,
      },
      status: PaymentStatuses.IN_PROGRESS,
    });

    return new ApiResponse(
      StatusCodes.CREATED,
      {
        transaction,
        url: depositInfo.data.authorization_url,
      },
      "Deposit transaction successfully created"
    );
  }
);

export const validateTransactionPin = apiResponseHandler(async (req) => {
  const { pin, accountId } = req.body;
  const account = await AccountModel.findOne({ _id: accountId });

  if (!account) {
    throw new CustomErrors("Account doesn't exists", StatusCodes.NOT_FOUND);
  }

  const matchPins = await bcrypt.compare(pin, account?.pin);

  console.log(matchPins);

  return new ApiResponse(
    StatusCodes.OK,
    { isValid: matchPins },
    matchPins ? "correct transaction pin" : "incorrect transaction pin"
  );
});

const getAccountDetails = async (accountId) => {
  const objectId = new mongoose.Types.ObjectId(accountId);

  console.log(accountId);
  return AccountModel.findById(objectId);
};

export const sendTransaction = apiResponseHandler(async (req, res) => {
  const {
    amount,
    from_account,
    to_account,
    description,
    currency = "NGN",
    channel = "card",
  } = req.body;

  if (!amount || !from_account || !to_account) {
    throw new CustomErrors("Missing transaction details", StatusCodes.BAD_REQUEST);
  }

  const [fromAccount, toAccount] = await Promise.all([
    getAccountDetails(from_account),
    getAccountDetails(to_account),
  ]);

  console.log("From Account:", fromAccount);
  console.log("To Account:", toAccount);

  if (!fromAccount || !toAccount) {
    throw new CustomErrors("One or both accounts not found", StatusCodes.NOT_FOUND);
  }

  const user = await UserModel.findById(req.user._id);
  if (!user) throw new CustomErrors("User not found", StatusCodes.NOT_FOUND);

  // Do not check balance or deduct now — wait until Paystack verifies
  const paymentInit = await PaymentService.initializePaystackPayment({
    email: user.email,
    amount,
    channel,
    currency,
  });

  if (!paymentInit?.status || !paymentInit.data) {
    throw new CustomErrors("Failed to initialize transfer", StatusCodes.INTERNAL_SERVER_ERROR);
  }

  const transaction = await TransactionModel.create({
    reference: paymentInit.data.reference,
    user: req.user._id,
    amount,
    description,
    currency,
    type: AvailableTransactionTypes.TRANSFER,
    detail: {
      gateway: PaymentMethods.PAYSTACK,
      receiverAccountNumber: toAccount.account_number,
      senderAccountNumber: fromAccount.account_number,
    },
    status: PaymentStatuses.IN_PROGRESS,
  });

  return new ApiResponse(
    StatusCodes.CREATED,
    {
      transaction,
      authorizationUrl: paymentInit.data.authorization_url,
    },
    "Redirect user to complete payment"
  );
});
