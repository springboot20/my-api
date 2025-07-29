import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { TransactionModel, AccountModel, WalletModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";
import PaymentService from "../../../../service/payment/payment.service.js";
import { AvailableAccountStatus, PaymentStatuses, paystackStatus } from "../../../../constants.js";
import { createHmac, timingSafeEqual } from "crypto";

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
      transaction.status = PaymentStatuses.COMPLETED;
    } else {
      transaction.status = PaymentStatuses.FAILED;
    }

    transaction.transactionStatus = transactionStatus;

    await transaction.save({});

    return new ApiResponse(StatusCodes.OK, { transaction }, "payment verified successfully");
  }
);

export const verifyPaystackDepositTransaction = apiResponseHandler(
  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async (req, res) => {
    const { reference } = req.query;
    const transaction = await TransactionModel.findOne({ reference });

    if (!transaction) {
      throw new CustomErrors("no transaction found", StatusCodes.NOT_FOUND);
    }

    if (transaction.status === PaymentStatuses.COMPLETED) {
      return new ApiResponse(StatusCodes.OK, { transaction }, "transaction already verified");
    }

    const transactionReference = transaction.reference;

    let response = await PaymentService.verifyHelper(transactionReference);

    if (!response) {
      return null;
    }

    const transactionStatus = response?.data?.status;
    const paymentConfirmed = transactionStatus === paystackStatus.success;

    if (paymentConfirmed) {
      transaction.status = PaymentStatuses.COMPLETED;

      const account = await AccountModel.findOne({ user: transaction?.user });

      if (account) {
        account.balance += transaction.amount;
        account.status = AvailableAccountStatus.ACTIVE;
        await account.save({});
      }
    } else {
      transaction.status = PaymentStatuses.FAILED;
    }

    transaction.transactionStatus = transactionStatus;

    await transaction.save({});

    return new ApiResponse(StatusCodes.OK, { transaction }, "payment verified successfully");
  }
);

/**
 * Paystack callback verification controller
 * @route GET /api/payment/paystack/callback
 */
export const verifyPaystackCallback = apiResponseHandler(async (req, res) => {
  const { reference } = req.query;

  if (!reference) {
    throw new CustomErrors("Transaction reference is required", StatusCodes.BAD_REQUEST);
  }

  const verifyResponse = await PaymentService.verifyHelper(reference);

  if (!verifyResponse?.status || !verifyResponse.data) {
    throw new CustomErrors("Transaction verification failed", StatusCodes.BAD_REQUEST);
  }

  const transaction = await TransactionModel.findOne({ reference });

  if (!transaction) {
    throw new CustomErrors("Transaction not found", StatusCodes.NOT_FOUND);
  }

  // If already completed, avoid duplicate processing
  if (transaction.status === PaymentStatuses.COMPLETED) {
    return new ApiResponse(StatusCodes.OK, { transaction }, "Transaction already completed");
  }

  const paystackStatus = verifyResponse.data.status;

  if (paystackStatus !== "success") {
    transaction.status = PaymentStatuses.FAILED;
    transaction.transactionStatus = paystackStatus;
    await transaction.save();
    return new ApiResponse(StatusCodes.OK, { transaction }, "Transaction failed on Paystack");
  }

  // Finalize transaction
  transaction.status = PaymentStatuses.COMPLETED;
  transaction.transactionStatus = paystackStatus;
  await transaction.save();

  const [fromAccount, toAccount] = await Promise.all([
    AccountModel.findOne({ account_number: transaction.detail.senderAccountNumber }),
    AccountModel.findOne({ account_number: transaction.detail.receiverAccountNumber }),
  ]);

  if (!fromAccount || !toAccount) {
    throw new CustomErrors("Sender or receiver account not found", StatusCodes.NOT_FOUND);
  }

  const [fromWallet, toWallet] = await Promise.all([
    WalletModel.findById(fromAccount.wallet),
    WalletModel.findById(toAccount.wallet),
  ]);

  if (!fromWallet || !toWallet) {
    throw new CustomErrors("Sender or receiver wallet not found", StatusCodes.NOT_FOUND);
  }

  // Confirm balance before final deduction
  if (fromWallet.balance < transaction.amount) {
    throw new CustomErrors("Insufficient funds in sender wallet", StatusCodes.BAD_REQUEST);
  }

  // Perform atomic balance update
  await Promise.all([
    WalletModel.findByIdAndUpdate(fromWallet._id, {
      $inc: { balance: -parseFloat(transaction.amount) },
    }),
    WalletModel.findByIdAndUpdate(toWallet._id, {
      $inc: { balance: parseFloat(transaction.amount) },
    }),
  ]);

  return new ApiResponse(StatusCodes.OK, { transaction }, "Transaction verified and completed");
});
