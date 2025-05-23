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

    let transaction = undefined;

    if (depositInfo.status === true) {
      transaction = await TransactionModel.create({
        reference: depositInfo.data.reference,
        user: req.user?._id,
        amount,
        description,
        currency,
        type: AvailableTransactionTypes.DEPOSIT,
        detail: {
          gateway: PaymentMethods.PAYSTACK,
        },
        status: PaymentStatuses.IN_PROGRESS,
      });
    }

    if (!transaction)
      throw new CustomErrors("error while deposit transaction", StatusCodes.INTERNAL_SERVER_ERROR);

    return new ApiResponse(
      StatusCodes.CREATED,
      { transaction, url: depositInfo.data.authorization_url },
      "deposit transaction successfull created"
    );
  }
);

const existingAccount = async (account, account_number) => {
  return await AccountModel.findOne({ $or: [{ _id: account }, { account_number }] });
};

export const sendTransaction = apiResponseHandler(async (req, res) => {
  const { amount, description, from_account, to_account } = req.body;

  const fromAccountExists = await existingAccount(from_account, undefined);
  const toAccountExists = await existingAccount(undefined, to_account);

  if (!fromAccountExists) {
    throw new CustomErrors("from account doesn't exists", StatusCodes.NOT_FOUND);
  }

  if (!toAccountExists) {
    throw new CustomErrors("to account doesn't exists", StatusCodes.NOT_FOUND);
  }

  if (fromAccountExists?._id === toAccountExists?._id) {
    throw new CustomErrors("cannot send to the same account", StatusCodes.BAD_REQUEST);
  }

  const fromWallet = await WalletModel.findOne({ account: fromAccountExists?._id });
  const toWallet = await WalletModel.findOne({ account: toAccountExists?._id });

  if (fromWallet.balance >= 100) {
    throw new CustomErrors("insufficient account balance", StatusCodes.BAD_REQUEST);
  }

  toWallet.balance = parseInt(toWallet.balance) + parseInt(amount);
  await toWallet.save();

  let transaction = await TransactionModel.create({
    // reference: depositInfo.data.reference,
    user: req.user?._id,
    amount,
    description,
    // currency,
    type: AvailableTransactionTypes.DEPOSIT,
    detail: {
      gateway: PaymentMethods.PAYSTACK,
      recieverAccountNumber: toAccountExists?.account_number,
    },
    status: PaymentStatuses.IN_PROGRESS,
  });

  return new ApiResponse(StatusCodes.OK, transaction, "transaction successfull");
});
