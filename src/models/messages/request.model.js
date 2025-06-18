import { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import {
  AvailableRequestActionsEnums,
  AvailableRequestPriorities,
  AvailableRequestPrioritiesEnums,
  AvailableRequestStatus,
  AvailableRequestStatusEnums,
} from "../../constants.js";

const RequestMessageSchema = new Schema(
  {
    type: {
      type: String,
    },
    adminMessageTitle: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receivers: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
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
    adminNotes: {
      type: String,
      maxLength: 1000,
    },
    priority: {
      type: String,
      enum: AvailableRequestPrioritiesEnums,
      default: AvailableRequestPriorities.MEDIUM,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

RequestMessageSchema.plugin(mongooseAggregatePaginate);

export const RequestMessageModel = model("RequestMessage", RequestMessageSchema);
