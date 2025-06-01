import { StatusCodes } from "http-status-codes";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { UserModel, ProfileModel } from "../../../models/index.js";
import { sendMail } from "../../../service/email.service.js";
import { RoleEnums } from "../../../constants.js";

export const registerAdminUser = apiResponseHandler(async (req, res) => {
  const { username, firstname, lastname, email, password, role } = req.body;

  const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });

  if (existingUser) throw new CustomErrors("user credentials exists", StatusCodes.CONFLICT);

  const user = await UserModel.create({
    username,
    email,
    password,
    role,
  });

  if (!user) throw new CustomErrors("error while creating user", StatusCodes.INTERNAL_SERVER_ERROR);

  const { unHashedToken, hashedToken, tokenExpiry } =
    (await user.generateTemporaryTokens()) || (await existingUser.generateTemporaryTokens());

  console.log({ unHashedToken, hashedToken, tokenExpiry });

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

  const profile = new ProfileModel({
    firstname,
    lastname,
    user: existingUser?._id || user?._id,
  });

  await profile.save();

  return new ApiResponse(
    StatusCodes.CREATED,
    {
      user,
      url: verificationLink,
    },
    "admin created successfully"
  );
});

export const register = apiResponseHandler(async (req, res) => {
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
