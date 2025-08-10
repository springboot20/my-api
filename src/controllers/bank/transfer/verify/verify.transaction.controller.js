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
import { emitSocketEventToUser } from "../../../../socket/socket.js";
import socketEvents from "../../../../enums/socket-events.js";

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
   * @route POST /api/payment/paystack/webhook
   */
  async (req) => {
    if (!req.body) return false;

    const signature = req.headers[process.env.PAYSTACK_HEADERS_SIGNATURE];

    let isValidPaystackEvent = false;
    try {
      const hash = createHmac(process.env.PAYSTACK_HASH_ALGO, process.env.PAYSTACK_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex");

      isValidPaystackEvent =
        hash && signature && timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
    } catch (error) {
      throw new CustomErrors("Invalid webhook signature", StatusCodes.UNAUTHORIZED);
    }

    if (!isValidPaystackEvent) return false;

    const reference = req.body?.reference;
    const _paystackStatus = req.body?.status; // ✅ FIX: define this
    const paymentConfirmed = _paystackStatus === paystackStatus.success;

    const transaction = await TransactionModel.findOne({ reference });
    const mirrorTransaction = await TransactionModel.findOne({
      reference: `${reference}-MIRROR`,
    });

    if (!transaction) {
      throw new CustomErrors("Transaction not found", StatusCodes.NOT_FOUND);
    }

    // ✅ Skip if already verified on both ends
    if (
      transaction.status === PaymentStatuses.COMPLETED &&
      (!mirrorTransaction || mirrorTransaction.status === PaymentStatuses.COMPLETED)
    ) {
      return new ApiResponse(
        StatusCodes.OK,
        { transaction, mirrorTransaction },
        "Transaction already completed"
      );
    }

    // Store gateway status
    transaction.transactionStatus = _paystackStatus;
    if (mirrorTransaction) mirrorTransaction.transactionStatus = _paystackStatus;

    if (!paymentConfirmed) {
      transaction.status = PaymentStatuses.FAILED;
      if (mirrorTransaction) mirrorTransaction.status = PaymentStatuses.FAILED;

      await Promise.all([
        transaction.save(),
        mirrorTransaction ? mirrorTransaction.save() : Promise.resolve(),
      ]);

      throw new CustomErrors(
        "Transaction verification failed",
        StatusCodes.INTERNAL_SERVER_ERROR,
        [],
        { transaction, mirrorTransaction }
      );
    }

    // ✅ Payment success — mark both COMPLETED and save immediately
    transaction.status = PaymentStatuses.COMPLETED;
    if (mirrorTransaction) mirrorTransaction.status = PaymentStatuses.COMPLETED;

    await Promise.all([
      transaction.save(),
      mirrorTransaction ? mirrorTransaction.save() : Promise.resolve(),
    ]);

    // ✅ Post-payment handling (won’t affect saved status)
    try {
      const fromAccount = await AccountModel.findOne({
        account_number: transaction.detail.senderAccountNumber,
      });

      const toAccount = await AccountModel.findOne({
        account_number: transaction.detail.receiverAccountNumber,
      });

      if (!fromAccount || !toAccount) {
        throw new CustomErrors("Sender or receiver account not found", StatusCodes.NOT_FOUND);
      }

      // Wallet transfer
      await transferBetweenWallets(fromAccount.wallet, toAccount.wallet, transaction.amount);

      // Socket events
      emitSocketEventToUser(
        req,
        socketEvents.DEBIT_TRANSACTION,
        `users-${fromAccount?.user?.toString()}`,
        transaction.toObject()
      );

      if (mirrorTransaction) {
        emitSocketEventToUser(
          req,
          socketEvents.DEPOSIT_TRANSACTION,
          `users-${toAccount?.user?.toString()}`,
          mirrorTransaction.toObject()
        );
      }

      return new ApiResponse(
        StatusCodes.OK,
        { transaction, mirrorTransaction },
        "Payment verified successfully"
      );
    } catch (postProcessError) {
      console.error("Post-payment processing failed:", postProcessError);
      return new ApiResponse(
        StatusCodes.OK,
        { transaction, mirrorTransaction, warning: "Post-processing failed" },
        "Payment completed but with post-processing errors"
      );
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

  // ✅ Find mirror transaction if exists
  const mirrorTransaction = await TransactionModel.findOne({
    reference: `${reference}-MIRROR`,
  });

  // ✅ Early exit if already completed on both sides
  if (
    transaction.status === PaymentStatuses.COMPLETED &&
    (!mirrorTransaction || mirrorTransaction.status === PaymentStatuses.COMPLETED)
  ) {
    return new ApiResponse(
      StatusCodes.OK,
      { transaction, mirrorTransaction },
      "Transaction already completed"
    );
  }

  // ✅ Verify with Paystack
  const verifyResponse = await PaymentService.verifyHelper(reference);
  const _paystackStatus = verifyResponse.data.status;
  const paymentConfirmed = _paystackStatus === paystackStatus.success;

  // Store gateway status
  transaction.transactionStatus = _paystackStatus;
  if (mirrorTransaction) mirrorTransaction.transactionStatus = _paystackStatus;

  // ❌ If payment failed, mark both as failed immediately
  if (!paymentConfirmed) {
    transaction.status = PaymentStatuses.FAILED;
    if (mirrorTransaction) mirrorTransaction.status = PaymentStatuses.FAILED;

    await Promise.all([
      transaction.save(),
      mirrorTransaction ? mirrorTransaction.save() : Promise.resolve(),
    ]);

    throw new CustomErrors(
      "Transaction verification failed",
      StatusCodes.INTERNAL_SERVER_ERROR,
      [],
      { transaction, mirrorTransaction }
    );
  }

  // ✅ Payment success — mark both COMPLETED and save immediately
  transaction.status = PaymentStatuses.COMPLETED;
  if (mirrorTransaction) mirrorTransaction.status = PaymentStatuses.COMPLETED;

  await Promise.all([
    transaction.save(),
    mirrorTransaction ? mirrorTransaction.save() : Promise.resolve(),
  ]);

  // ✅ Now handle post-payment operations separately
  try {
    const fromAccount = await AccountModel.findOne({
      account_number: transaction.detail.senderAccountNumber,
    });

    const toAccount = await AccountModel.findOne({
      account_number: transaction.detail.receiverAccountNumber,
    });

    if (!fromAccount || !toAccount) {
      throw new CustomErrors("Sender or receiver account not found", StatusCodes.NOT_FOUND);
    }

    // Wallet transfer
    await transferBetweenWallets(fromAccount.wallet, toAccount.wallet, transaction.amount);

    // Notify users
    emitSocketEventToUser(
      req,
      socketEvents.DEBIT_TRANSACTION,
      `users-${fromAccount?.user?.toString()}`,
      transaction.toObject()
    );

    if (mirrorTransaction) {
      emitSocketEventToUser(
        req,
        socketEvents.DEPOSIT_TRANSACTION,
        `users-${toAccount?.user?.toString()}`,
        mirrorTransaction.toObject()
      );
    }

    return new ApiResponse(
      StatusCodes.OK,
      { transaction, mirrorTransaction },
      "Payment verified successfully"
    );
  } catch (postProcessError) {
    // ❗ Payment is still completed — only log post-processing issues
    console.error("Post-payment processing failed:", postProcessError);
    return new ApiResponse(
      StatusCodes.OK,
      { transaction, mirrorTransaction, warning: "Post-processing failed" },
      "Payment completed but with post-processing errors"
    );
  }
});
