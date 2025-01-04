import { Schema, model } from "mongoose";
import {
  AvailableCurrencyTypes,
  AvailableCurrencyTypesEnum,
  AvailableTransactionTypes,
  AvailableTransactionTypesEnum,
  PaymentMethods,
  AvailablePaymentStatusEnums,
  AvailablePaymentMethods
} from "../../../constants.js";

const TransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },
    reference: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    type: {
      type: String,
      enum: AvailableTransactionTypesEnum,
      default: AvailableTransactionTypes.TRANSFER,
    },
    currency: {
      type: String,
      enum: AvailableCurrencyTypesEnum,
      default: AvailableCurrencyTypes.NGN,
    },
    description: {
      type: String,
      maxLenght: 150,
    },
    transactionStatus: String,
    detail: {
      type: {
        gateway: {
          type: String,
          enum: AvailablePaymentMethods,
          default: PaymentMethods.UNKNOWN,
        },
        recieverAccountNumber: {
          type: String,
        },
      },
    },
    status: {
      type: String,
      enum: AvailablePaymentStatusEnums,
    },
  },
  { timestamps: true },
);

const TransactionModel = model("transaction", TransactionSchema);

export { TransactionModel };
