import { StatusCodes } from "http-status-codes";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { UserModel, ProfileModel } from "../../../models/index.js";
import { sendMail } from "../../../service/email.service.js";

export const registerAdminUser = apiResponseHandler(async (req) => {
  const { email, password, lastname, firstname, role, phone_number } = req.body;

  const existingUser = await UserModel.findOne({ email });

  if (existingUser) throw new CustomErrors("user credentials exists", StatusCodes.CONFLICT);

  const user = await UserModel.create({
    email,
    lastname,
    firstname,
    role,
    phone_number,
    password,
  });

  if (!user) throw new CustomErrors("error while creating user", StatusCodes.INTERNAL_SERVER_ERROR);

  const username = email.split("@")[0];

  await ProfileModel.create({
    userId: user?._id,
    role,
    username: `@${username}`,
  });

  const { unHashedToken, hashedToken, tokenExpiry } = await user.generateTemporaryTokens();

  console.log("line 34: ", { unHashedToken, hashedToken, tokenExpiry });

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;
  await user.save();

  const createdUser = await UserModel.findById(user._id).select("-password -refreshToken");

  const link =
    process.env.NODE_ENV === "production"
      ? process.env.BASE_URL_PRDO_ADMIN
      : process.env.BASE_URL_DEV;

  const verificationLink = `${link}/auth/email/verify-email?userId=${
    createdUser?._id || existingUser?._id
  }&token=${unHashedToken}`;

  const name =
    `${createdUser.firstname} ${createdUser.lastname}` ||
    `${existingUser.firstname} ${existingUser.lastname}`;

  await sendMail({
    to: createdUser.email || existingUser?.email,
    subject: "Welcome Mail",
    templateName: "welcome",
    data: {
      dashboardUrl: `${link}/app/overview`,
      appName: process.env.APP_NAME,
      name,
    },
  });

  await sendMail({
    to: createdUser.email || existingUser?.email,
    subject: "Email verification",
    templateName: "verify-mail",
    data: {
      verificationLink,
      appName: process.env.APP_NAME,
      name,
    },
  });

  return new ApiResponse(
    StatusCodes.CREATED,
    {
      user: createdUser,
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

  const username = email.split("@")[0];

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
    role,
    username: `@${username}`,
  });

  const createdUser = await UserModel.findById(user._id).select("-password -refreshToken");

  const link =
    process.env.NODE_ENV === "production"
      ? process.env.BASE_URL_PRDO_ADMIN
      : process.env.BASE_URL_DEV;

  const verificationLink = `${link}/verify-email?userId=${
    createdUser?._id || existingUser?._id
  }&token=${unHashedToken}`;

  const name =
    `${createdUser.firstname} ${createdUser.lastname}` ||
    `${existingUser.firstname} ${existingUser.lastname}`;

  await sendMail({
    to: createdUser.email || existingUser?.email,
    subject: "Welcome Mail",
    templateName: "welcome",
    data: {
      dashboardUrl: `${link}/admin/overview`,
      appName: process.env.APP_NAME,
      name,
    },
  });

  await sendMail({
    to: createdUser.email || existingUser?.email,
    subject: "Email verification",
    templateName: "verify-mail",
    data: {
      verificationLink,
      appName: process.env.APP_NAME,
      name,
    },
  });

  return new ApiResponse(
    StatusCodes.CREATED,
    {
      user: createdUser,
      url: verificationLink,
    },
    "User registration successfull and verification email has been sent to you email"
  );
});
