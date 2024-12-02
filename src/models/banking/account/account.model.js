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
      default: AvailableAccountTypes.SAVINGS,
    },
    balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: AvailableAccountStatusEnums,
      default: AvailableAccountStatus.INACTIVE,
    },
  },
  { timestamps: true },
);

export const AccountModel = model("Account", AccountSchema);
