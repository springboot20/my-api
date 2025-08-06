import { Schema, model } from "mongoose";
import { AvailableCurrencyTypes, AvailableCurrencyTypesEnum } from "../../../constants.js";

const WalletSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      enum: AvailableCurrencyTypesEnum,
      default: AvailableCurrencyTypes.NGN,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const WalletModel = model("Wallet", WalletSchema);
