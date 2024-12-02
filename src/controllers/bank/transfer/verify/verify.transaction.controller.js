import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { TransactionModel, AccountModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";
import PaymentService from "../../../../service/payment/payment.service.js";
import { PaymentStatuses, paystackStatus } from "../../../../constants.js";
import { mongooseTransactions } from "../../../../middleware/mongoose/mongoose.transactions.js";
import { createHmac, timingSafeEqual } from "crypto";

export const verifyPaystackDepositTransaction = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('mongoose').ClientSession} session
     */
    async (req, res, session) => {
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
          await account.save({ session });
        }
      } else {
        transaction.status = PaymentStatuses.FAILED;
      }

      transaction.transactionStatus = transactionStatus;

      await transaction.save({ session });

      return new ApiResponse(StatusCodes.OK, { transaction }, "payment verified successfully");
    },
  ),
);

export const verifyPaystackWebhook = apiResponseHandler(
  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async (req, res) => {
    if (!req.body) {
      return false;
    }

    let isValidPaystackEvent = false;
    let signature = req.headers[process.env.PAYSTACK_HEADERS_SIGNATURE];

    try {
      const hash = createHmac(process.env.PAYSTACK_HASH_ALGO, process.env.CLOUDINARY_API_SECRET)
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

    await transaction.save({ session });

    return new ApiResponse(StatusCodes.OK, { transaction }, "payment verified successfully");
  },
);
