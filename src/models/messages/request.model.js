import { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

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
      enum: [],
      default: "NONE",
    },
    message: {
      type: String,
      required: true,
      maxLength: 500,
    },
    status: {
      type: String,
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
      enum: [],
    },
  },
  { timestamps: true }
);

export const RequestMessageModel = model("RequestMessage", RequestMessageSchema);
