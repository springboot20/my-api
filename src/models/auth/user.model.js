import { Schema, model } from "mongoose";
import argon from "argon2";

const userSchema = new Schema(
  {
    avatar: {
      type: {
        url: String,
        localPath: String,
      },
      default:''
    },
    username: {
      type: String,
      index: true,
      trim: true,
      required: true,
      lowercase: true,
      unique: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: { type: String },
    forgotPasswordToken: { type: String },
    forgotPasswordTokenExpiry: { type: Date, default: Date.now() },
    emailVerificationToken: { type: String },
    emailVerificationTokenExpiry: { type: Date, default: Date.now() },
    loginType: {
      type: String,
      enum: ["email_and_password", "google"],
      default: "email_and_password",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await argon.hash(this.password);
  next()
});

const UserModel = model("User", userSchema);

export { UserModel };
