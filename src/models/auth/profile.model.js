import { Schema, model } from "mongoose";
import { AvailableRoles, RoleEnums } from "../../constants.js";

const ProfileSchema = new Schema(
  {
    username: {
      type: String,
      index: true,
      trim: true,
      lowercase: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    present_address: {
      type: String,
      default: "",
    },
    permanent_address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    postal_code: {
      type: String,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: AvailableRoles,
      default: RoleEnums.USER,
    },
    // Add preferred view setting for app switching
    preferred_view: {
      type: String,
      enum: ["app", "dashboard"],
      default: "app", // Default to main banking app view
    },
    currency: {
      type: String,
      enum: ["USD", "NGN"],
      default: "NGN",
    },
    timezone: {
      type: Date,
      default: Date.now(),
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ProfileModel = model("Profile", ProfileSchema);
