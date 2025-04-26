import { Schema, model } from "mongoose";
import {
  AvailableAccountEnums,
  AvailableAccountStatus,
  AvailableAccountStatusEnums,
  AvailableAccountTypes,
} from "../../../constants.js";

const AccountSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    account_number: {
      type: String,
    },
    type: {
      type: String,
      enum: AvailableAccountEnums,
      default: AvailableAccountTypes.NONE,
    },
    status: {
      type: String,
      enum: AvailableAccountStatusEnums,
      default: AvailableAccountStatus.INACTIVE,
    },
    cards: [
      {
        type: Schema.Types.ObjectId,
        ref: "Card",
      },
    ],
  },
  { timestamps: true }
);

AccountSchema.index({ user: 1, account_number: 1 });
AccountSchema.index({ account_number: 1 }, { unique: true });

export const AccountModel = model("Account", AccountSchema);
