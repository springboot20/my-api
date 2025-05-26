import { Schema, model } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import {
  AvailableRequestActionsEnums,
  AvailableRequestPriorities,
  AvailableRequestPrioritiesEnums,
  AvailableRequestStatus,
  AvailableRequestStatusEnums,
} from "../../constants.js";

const RequestMessageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: AvailableRequestActionsEnums,
      require: true,
    },
    message: {
      type: String,
      required: true,
      maxLength: 500,
    },
    status: {
      type: String,
      enum: AvailableRequestStatusEnums,
      default: AvailableRequestStatus.PENDING,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
      default: Date.now(),
    },
    admiNotes: {
      type: String,
      maxLength: 1000,
    },
    priority: {
      type: String,
      enum: AvailableRequestPrioritiesEnums,
      default: AvailableRequestPriorities.MEDIUM,
    },
  },
  { timestamps: true }
);

export const RequestMessageModel = model("RequestMessage", RequestMessageSchema);
