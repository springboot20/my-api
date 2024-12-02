import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { TransactionModel, UserModel } from "../../../../models/index.js";
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

    console.log(depositInfo);
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
      "deposit transaction successfull created",
    );
  },
);
