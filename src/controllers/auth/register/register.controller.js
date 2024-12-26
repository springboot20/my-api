import { StatusCodes } from "http-status-codes";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { mongooseTransactions } from "../../../middleware/mongoose/mongoose.transactions.js";
import { UserModel } from "../../../models/index.js";
import { sendMail } from "../../../service/email.service.js";
import { RoleEnums } from "../../../constants.js";

export const register = apiResponseHandler(
  mongooseTransactions(async (req, res, session) => {
    const { email, password, username, role } = req.body;

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser)
      throw new CustomErrors("user with username or email already exists", StatusCodes.CONFLICT);

    const user = await UserModel.create({
      username,
      email,
      password,
      role: role || RoleEnums.USER,
      isEmailVerified: false,
    });

    const { unHashedToken, hashedToken, tokenExpiry } = await user.generateTemporaryTokens();

    console.log({ unHashedToken, hashedToken, tokenExpiry });

    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    const verificationLink = `${process.env.BASE_URL}/verify-email/${user._id}/${unHashedToken}`;

    await sendMail(
      user.email,
      "Email verification",
      { verificationLink, username: user.username },
      "email"
    );

    const createdUser = await UserModel.findById(user._id).select("-password -refreshToken");

    return new ApiResponse(
      StatusCodes.CREATED,
      {
        user: createdUser,
      },
      "User registration successfull and verification email has been sent to you email"
    );
  })
);
