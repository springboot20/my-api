import { Schema, model } from "mongoose";
import {
  AvailableCardTypes,
  AvailableCardEnums,
  AvailableCardStatus,
  AvailableCardStatusEnums,
} from "../../../constants.js";

const CardSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    primary_account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    linked_accounts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Account",
      },
    ],
    card_name: {
      type: String,
      required: true,
    },
    valid_thru: {
      type: String,
      required: true,
    },
    card_number: {
      type: String,
      required: true,
    },
    cvv: {
      type: String,
      required: true,
      select: false,
    },
    type: {
      type: String,
      enums: AvailableCardEnums,
      default: AvailableCardTypes.VERVE_DEBIT,
    },
    status: {
      type: String,
      enums: AvailableCardStatusEnums,
      default: AvailableCardStatus.INACTIVE,
    },
    daily_limit: {
      type: Number,
      default: 1000,
    },
    is_blocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CardSchema.index({ user: 1, card_number: 1 });
CardSchema.index({ card_number: 1 }, { unique: true });
CardSchema.index({ primary_account: 1 });

export const CardModel = model("Card", CardSchema);
