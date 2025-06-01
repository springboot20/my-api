import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { AvailableRoles, RoleEnums } from "../../constants.js";
import { AccountModel } from "../banking/account/account.model.js";
import { ProfileModel } from "./profile.model.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

/**
 * @swagger 
 * components:
 *   schemas:
 *     CreateUser:
 *       type: object
 *       required:
 *       - username
 *       - email
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         username:
 *           type: string
 *           description: Unique username for the user
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         phone_number:
 *           type: string
 *           description: User's phone number
 *         role:
 *           type: string
 *           enum: [ USER, ADMIN ]
 *           description: User role for authorization
 *         avatar:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               description: URL of the user's avatar image
 *             public_id:
 *               type: string
 *               description: Public ID for the avatar in Cloudinary
 *         isEmailVerified:
 *           type: boolean
 *           description: Indicates if the user's email is verified
 *       i  sAuthenticated:
 *           type: boolean
 *           description: Indicates if the user is currently authenticated
 *       example:
 *         username: john_doe
 *         email: john@example.com
 *         phone_number: "1234567890"
 *         role: USER
 *         avatar:
 *           url: https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg
 *           public_id: ecommerce/users-image/avatar
 *         isEmailVerified: true
 *         isAuthenticated: true

 *     ApiResponse:
 *       type: object
 *       properties:
 *         statusCode:
 *           type: integer
 *           description: HTTP status code
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           type: object
 *           description: Response data

 *     LoginResponse:
 *       type: object
 *       properties:
 *         statusCode:
 *           type: integer
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             tokens:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string

 *     VerificationResponse:
 *       type: object
 *       properties:
 *         statusCode:
 *           type: integer
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             isEmailVerified:
 *               type: boolean

 *     Error:
 *       type: object
 *       properties:
 *         statusCode:
 *           type: integer
 *         message:
 *           type: string
 *         errors:
 *           type: array
 *           items:
 *             type: string
 * 
 */

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
    username: {
      type: String,
      index: true,
      trim: true,
      required: true,
      lowercase: true,
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
    isEmailVerified: {
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

userSchema.post("save", async function (user, next) {
  try {
    await ProfileModel.findOneAndUpdate(
      {
        user: user?._id,
      },
      {
        $setOnInsert: {
          user: user._id,
        },
      },
      { upsert: true, new: true }
    );

    next();
  } catch (error) {
    next(error);
  }
});

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
