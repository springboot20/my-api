import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { TransactionModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";
import PaymentService from "../../../../service/payment/payment.service.js";
import { PaymentStatuses, paystackStatus } from "../../../../constants.js";
import { mongooseTransactions } from "../../../../middleware/mongoose/mongoose.transactions.js";

export const verifyPaystackDepositTransaction = apiResponseHandler(
  mongooseTransactions(
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('mongoose').ClientSession} session
     */
    async (req, res, session) => {
      const { reference } = req.params;
      const transaction = await TransactionModel.findOne({ reference });

      if (!transaction) {
        throw new CustomErrors("no transaction found", StatusCodes.NOT_FOUND);
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
      } else {
        transaction.status = PaymentStatuses.FAILED;
      }

      transaction.transactionStatus = transactionStatus;

      await transaction.save({ session });

      return new ApiResponse(StatusCodes.OK, { transaction }, "payment verified successfully");
    },
  ),
);
