import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { TransactionModel, AccountModel, WalletModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";
import PaymentService from "../../../../service/payment/payment.service.js";
import { PaymentStatuses, paystackStatus } from "../../../../constants.js";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Transfer funds between two wallets
 * @param {ObjectId} fromWalletId - Sender's wallet ID
 * @param {ObjectId} toWalletId - Receiver's wallet ID
 * @param {Number} amount - Amount to transfer
 */
export const transferBetweenWallets = async (fromWalletId, toWalletId, amount) => {
  const [fromWallet, toWallet] = await Promise.all([
    WalletModel.findById(fromWalletId),
    WalletModel.findById(toWalletId),
  ]);

  if (!fromWallet || !toWallet) {
    throw new CustomErrors("Sender or receiver wallet not found", StatusCodes.NOT_FOUND);
  }

  if (fromWallet._id.equals(toWallet._id)) {
    throw new CustomErrors("Cannot transfer to the same wallet", StatusCodes.BAD_REQUEST);
  }

  if (fromWallet.balance < amount) {
    throw new CustomErrors("Insufficient funds in sender wallet", StatusCodes.BAD_REQUEST);
  }

  await Promise.all([
    WalletModel.findByIdAndUpdate(fromWallet._id, {
      $inc: { balance: -parseFloat(amount) },
    }),
    WalletModel.findByIdAndUpdate(toWallet._id, {
      $inc: { balance: parseFloat(amount) },
    }),
  ]);
};

export const verifyPaystackWebhook = apiResponseHandler(
  /**
   * @route GET /api/payment/paystack/callback
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async (req) => {
    if (!req.body) {
      return false;
    }

    let isValidPaystackEvent = false;
    let signature = req.headers[process.env.PAYSTACK_HEADERS_SIGNATURE];

    try {
      const hash = createHmac(process.env.PAYSTACK_HASH_ALGO, process.env.PAYSTACK_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex");

      isValidPaystackEvent =
        hash && signature && timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
    } catch (error) {
      throw error;
    }

    if (!isValidPaystackEvent) {
      return false;
    }

    const transaction = await TransactionModel.findOne({ reference: req.body.reference });

    const transactionStatus = req.body?.status;
    const paymentConfirmed = transactionStatus === paystackStatus.success;

    if (paymentConfirmed) {
      if (transaction.status === PaymentStatuses.COMPLETED) {
        return new ApiResponse(StatusCodes.OK, { transaction }, "Transaction already completed");
      }

      const fromAccount = await AccountModel.findOne({
        account_number: transaction.detail.senderAccountNumber,
      });
      const toAccount = await AccountModel.findOne({
        account_number: transaction.detail.receiverAccountNumber,
      });

      if (!fromAccount || !toAccount) {
        throw new CustomErrors("Sender or receiver account not found", StatusCodes.NOT_FOUND);
      }

      await transferBetweenWallets(fromAccount.wallet, toAccount.wallet, transaction.amount);

      transaction.status = PaymentStatuses.COMPLETED;
      transaction.transactionStatus = transactionStatus;
      await transaction.save();

      return new ApiResponse(StatusCodes.OK, { transaction }, "payment verified successfully");
    }
  }
);

export const verifyPaystackCallback = apiResponseHandler(async (req, res) => {
  const { reference } = req.query;

  if (!reference) {
    throw new CustomErrors("Transaction reference is required", StatusCodes.BAD_REQUEST);
  }

  const transaction = await TransactionModel.findOne({ reference });

  if (!transaction) {
    throw new CustomErrors("Transaction not found", StatusCodes.NOT_FOUND);
  }

  // Already completed
  if (transaction.status === PaymentStatuses.COMPLETED) {
    return new ApiResponse(StatusCodes.OK, { transaction }, "Transaction already completed");
  }

  const verifyResponse = await PaymentService.verifyHelper(reference);

  if (!verifyResponse) {
    transaction.status = PaymentStatuses.FAILED;
    await transaction.save();

    throw new CustomErrors(
      "Transaction verification failed",
      StatusCodes.INTERNAL_SERVER_ERROR,
      [],
      { transaction }
    );
  }

  console.log(verifyResponse);

  const _paystackStatus = verifyResponse.data.status;
  console.log(_paystackStatus);
  const paymentConfirmed = _paystackStatus === paystackStatus.success;

  transaction.transactionStatus = _paystackStatus;
  transaction.status = paymentConfirmed ? PaymentStatuses.COMPLETED : PaymentStatuses.FAILED;

  if (!paymentConfirmed) {
    await transaction.save();
    return new ApiResponse(StatusCodes.OK, { transaction }, "Payment verification failed");
  }

  // Prevent duplicate processing
  if (transaction.status === PaymentStatuses.COMPLETED) {
    return new ApiResponse(StatusCodes.OK, { transaction }, "Transaction already completed");
  }

  const fromAccount = await AccountModel.findOne({
    account_number: transaction.detail.senderAccountNumber,
  });

  const toAccount = await AccountModel.findOne({
    account_number: transaction.detail.receiverAccountNumber,
  });

  if (!fromAccount || !toAccount) {
    throw new CustomErrors("Sender or receiver account not found", StatusCodes.NOT_FOUND);
  }

  await transferBetweenWallets(fromAccount.wallet, toAccount.wallet, transaction.amount);

  await transaction.save();

  return new ApiResponse(StatusCodes.OK, { transaction }, "Payment verified successfully");
});
