import { Schema, model } from "mongoose";
import {
  AvailableCurrencyTypes,
  AvailableCurrencyTypesEnum,
  AvailableTransactionTypes,
  AvailableTransactionTypesEnum,
} from "../../constants.js";

const TransactionSchema = new Schema(
  {
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      emun: AvailableTransactionTypesEnum,
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
  },
  { timestamps: true },
);

const TransactionModel = model("transaction", TransactionSchema);

export { TransactionModel };
