import { StatusCodes } from "http-status-codes";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { mongooseTransactions } from "../../../middleware/mongoose/mongoose.transactions.js";
import { UserModel } from "../../../models/index.js";
import { sendMail } from "../../../service/email.service.js";

export const register = apiResponseHandler(
  mongooseTransactions(async (req, res, session) => {
    const { email, password, username, role } = req.body;

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser)
      throw new CustomErrors(
        "user with username or email already exists",
        StatusCodes.CONFLICT,
      );

    const user = await UserModel.create({
      username,
      email,
      password,
      role: role || "user",
      isEmailVerified: false,
    });

    const { unHashedToken, hashedToken, tokenExpiry } =
      await user.generateTemporaryTokens();

    console.log({ unHashedToken, hashedToken, tokenExpiry });

    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    const createdUser = await UserModel.findById(user._id).select(
      "-password -refreshToken",
    );

    console.log(unHashedToken);

    console.log(`${req.protocol}://${req.get("host")}`);

    const verificationLink = `${process.env.BASE_URL}/verify-email/${user?._id}/${unHashedToken}`;
    // const verificationLink = `${req.protocol}://${req.get(
    //   "host",
    // )}/api/v1/users/${user._id}/verify-email/${unHashedToken}`;

    await sendMail(
      user.email,
      "Email verification",
      { verificationLink, username: user.username },
      "email",
    );

    return new ApiResponse(
      StatusCodes.CREATED,
      {
        user: createdUser,
      },
      "user successfully created",
    );
  }),
);
