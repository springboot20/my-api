import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    avatar: {
      type: String,
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
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10); // 10 is a reasonable salt rounds value

    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    next(error); // Pass error to next middleware
  }
});

/**
 *
 * @param {string} entered_password
 * @param {string} dbPassword
 * @returns Promise<boolean>
 */
userSchema.methods.matchPasswords = async function (entered_password) {
  return await bcrypt.compare(entered_password, this.password);
};

const UserModel = model("User", userSchema);

export { UserModel };
