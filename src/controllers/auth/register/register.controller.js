import { StatusCodes } from "http-status-codes";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { UserModel, ProfileModel } from "../../../models/index.js";
import { sendMail } from "../../../service/email.service.js";
import * as bcrypt from "bcrypt";

/**
 *
 * @param {string} password
 * @param {boolean} saltRound
 * @returns {string}
 */
const hashPassword = (password, saltRound) => {
  const salt = bcrypt.genSaltSync(saltRound); // 10 is a reasonable salt rounds value
  return bcrypt.hashSync(password, salt);
};

export const registerAdminUser = apiResponseHandler(async (req) => {
  const { email, password, lastname, firstname, role, phone_number } = req.body;

  const existingUser = await UserModel.findOne({ email });

  if (existingUser) throw new CustomErrors("user credentials exists", StatusCodes.CONFLICT);

  const user = new UserModel({
    email,
    lastname,
    firstname,
    role,
    phone_number,
  });

  if (!user) throw new CustomErrors("error while creating user", StatusCodes.INTERNAL_SERVER_ERROR);

  const profile = new ProfileModel({
    userId: user?._id,
  });

  await profile.save();

  const { unHashedToken, hashedToken, tokenExpiry } = await existingUser.generateTemporaryTokens();

  user.password = hashPassword(password, 20);
  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  const link =
    process.env.NODE_ENV === "production"
      ? process.env.BASE_URL_PRDO_ADMIN
      : process.env.BASE_URL_DEV;

  const verificationLink = `${link}/verify-email?userId=${
    user?._id || existingUser?._id
  }&token=${unHashedToken}`;

  console.log("verification link", verificationLink);
  console.log("link", process.env.BASE_URL_PROD_ADMIN);

  await sendMail(
    user.email || existingUser?.email,
    "Email verification",
    {
      verificationLink,
      username: user.username || existingUser?.username,
      from: process.env.EMAIL,
      app: process.env.APP_NAME,
    },
    "email"
  );

  return new ApiResponse(
    StatusCodes.CREATED,
    {
      user,
      url: verificationLink,
    },
    "admin created successfully"
  );
});

export const register = apiResponseHandler(async (req) => {
  console.log(req.body);
  const { email, password, lastname, firstname, role, phone_number } = req.body;

  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    throw new CustomErrors("user with username or email already exists", StatusCodes.CONFLICT);
  }

  const user = await UserModel.create({
    email,
    lastname,
    firstname,
    password,
    role,
    phone_number,
  });

  const { unHashedToken, hashedToken, tokenExpiry } = await user.generateTemporaryTokens();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;
  await user.save();

  if (!user) throw new CustomErrors("error while creating user", StatusCodes.INTERNAL_SERVER_ERROR);

  await ProfileModel.create({
    userId: user?._id,
  });

  const link =
    process.env.NODE_ENV === "production" ? process.env.BASE_URL_PROD : process.env.BASE_URL_DEV;

  const verificationLink = `${link}/verify-email?userId=${user?._id}&token=${unHashedToken}`;

  console.log("verification link", verificationLink);
  console.log("link", process.env.BASE_URL_PROD);

  await sendMail(
    user.email,
    "Email verification",
    {
      verificationLink,
      username: user.username,
      from: process.env.EMAIL,
      app: process.env.APP_NAME,
    },
    "email"
  );

  const createdUser = await UserModel.findById(user._id).select("-password -refreshToken");

  return new ApiResponse(
    StatusCodes.CREATED,
    {
      user: createdUser,
      url: verificationLink,
    },
    "User registration successfull and verification email has been sent to you email"
  );
});
