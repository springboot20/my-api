import { StatusCodes } from "http-status-codes";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { mongooseTransactions } from "../../../middleware/mongoose/mongoose.transactions.js";
import { UserModel } from "../../../models/index.js";
import { generateTemporaryTokens } from "../../../utils/jwt.js";

export const register = apiResponseHandler(
  mongooseTransactions(
    async (
      req,
      res,
      session
    ) => {
      const { email, password, username, role } = req.body;

      const existingUser = await UserModel.findOne({
        $or: [{ email }, { password }],
      });

      if (existingUser)
        throw new CustomErrors(
          "user with username or email already exists",
          StatusCodes.CONFLICT
        );

      const user = await UserModel.create({
        username,
        email,
        password,
        role: role || "user",
        isEmailVerified: false,
      });

      const { unHashedToken, hashedToken, tokenExpiry } =
        await generateTemporaryTokens();

      user.emailVerificationToken = hashedToken;
      user.emailVerificationTokenExpiry = new Date(tokenExpiry);

      const createdUser = await UserModel.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
      );

      const verificationLink = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/verify-email/${user?._id}/${unHashedToken}`;

      await user.save({ validateBeforeSave: false });

      return new ApiResponse(
        StatusCodes.OK,
        {
          user: createdUser,
        },
        "user successfully created"
      );
    }
  )
);
