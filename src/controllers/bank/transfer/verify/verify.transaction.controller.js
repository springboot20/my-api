import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { TransactionModel, AccountModel } from "../../../../models/index.js";
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

    await transaction.save({ session });

    return new ApiResponse(StatusCodes.OK, { transaction }, "payment verified successfully");
  }
);

export const verifyPaystackCallback = apiResponseHandler(
  /**
   * Paystack callback verification controller
   * @route GET /api/payment/paystack/callback
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async (req, res) => {
    const { reference } = req.query;

    if (!reference) {
      throw new CustomErrors("Transaction reference is required", StatusCodes.BAD_REQUEST);
    }

    const transaction = await TransactionModel.findOne({ reference });

    if (!transaction) {
      throw new CustomErrors("Transaction not found", StatusCodes.NOT_FOUND);
    }

    if (transaction.status === PaymentStatuses.COMPLETED) {
      return res.redirect(`${process.env.FRONTEND_PAYMENT_SUCCESS_URL}?reference=${reference}`);
    }

    const verifyResponse = await PaymentService.verifyHelper(reference);

    if (!verifyResponse?.data) {
      throw new CustomErrors("Unable to verify transaction", StatusCodes.BAD_REQUEST);
    }

    const status = verifyResponse.data.status;

    if (status === paystackStatus.success) {
      transaction.status = PaymentStatuses.COMPLETED;
      transaction.transactionStatus = status;

      const account = await AccountModel.findOne({ user: transaction.user });
      if (account) {
        account.balance += transaction.amount;
        account.status = AvailableAccountStatus.ACTIVE;
        await account.save();
      }

      await transaction.save();
      return res.redirect(`${process.env.FRONTEND_PAYMENT_SUCCESS_URL}?reference=${reference}`);
    }

    transaction.status = PaymentStatuses.FAILED;
    transaction.transactionStatus = status;
    await transaction.save();

    return res.redirect(`${process.env.FRONTEND_PAYMENT_FAILED_URL}?reference=${reference}`);
  }
);
