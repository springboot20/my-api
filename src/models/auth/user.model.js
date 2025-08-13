import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { AvailableRoles, RoleEnums } from "../../constants.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const userSchema = new Schema(
  {
    avatar: {
      type: {
        public_id: String,
        url: String,
      },
      default: {
        public_id: null,
        url: `https://via.placeholder.com/200x200.png`,
      },
    },
    firstname: {
      type: String,
      default: "John",
      trim: true,
    },
    phone_number: {
      type: String,
      default: "",
    },
    lastname: {
      type: String,
      default: "Doe",
      trim: true,
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
      enum: AvailableRoles,
      default: RoleEnums.USER,
    },
    isAuthenticated: {
      type: Boolean,
      default: false,
    },
    refreshToken: { type: String },
    forgotPasswordToken: { type: String },
    forgotPasswordTokenExpiry: { type: Date },
    emailVerificationToken: { type: String },
    emailVerificationTokenExpiry: { type: Date },
    loginType: {
      type: String,
      enum: ["email_and_password", "google"],
      default: "email_and_password",
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

userSchema.plugin(mongooseAggregatePaginate);

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

userSchema.methods.generateTemporaryTokens = function () {
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  // Generate salt and hash the token synchronously
  const salt = bcrypt.genSaltSync(10); // Use synchronous version for hashing
  const hashedToken = bcrypt.hashSync(unHashedToken, salt);

  const tokenExpiry = Date.now() + 20 * 60 * 1000; // 20 minutes from now

  return { unHashedToken, hashedToken, tokenExpiry };
};

const UserModel = model("User", userSchema);

export { UserModel };
