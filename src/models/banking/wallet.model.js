import { Schema, model } from "mongoose";
import {
  AvailableAccountStatus,
  AvailableAccountStatusEnums,
} from "../../constants.js";

const WalletSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      enum: AvailableAccountStatusEnums,
      default: AvailableAccountStatus.INACTIVE,
    },
  },
  { timestamps: true },
);

const WalletModel = model("Wallet", WalletSchema);

export { WalletModel };
