import { Schema, model } from "mongoose";

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
      default: "USD",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const WalletModel = model("Wallet", WalletSchema);
