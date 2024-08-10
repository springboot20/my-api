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
      throw new CustomErrors("user with username or email already exists", StatusCodes.CONFLICT);

    const user = await UserModel.create({
      username,
      email,
      password,
      role: role || "user",
      isEmailVerified: false,
    });

    await user.save({ validateBeforeSave: false });

    const createdUser = await UserModel.findById(user._id).select("-password -refreshToken");

    return new ApiResponse(
      StatusCodes.CREATED,
      {
        user: createdUser,
      },
      "user successfully created",
    );
  }),
);
