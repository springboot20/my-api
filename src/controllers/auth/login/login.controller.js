import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { UserModel } from "../../../models/index.js";
import { generateTokens } from "../../../utils/jwt.js";
import { StatusCodes } from "http-status-codes";

export const login = apiResponseHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log(req.body);

  const user = await UserModel.findOne({ email });

  if (!user) throw new CustomErrors("user does not exists", StatusCodes.NOT_FOUND);

  if (!(email && password))
    throw new CustomErrors("please provide an email and a password", StatusCodes.BAD_REQUEST);

  if (!(await user.matchPasswords(password)))
    throw new CustomErrors("invalid password entered", StatusCodes.UNAUTHORIZED);

  const { accessToken, refreshToken } = await generateTokens(user?._id);

  const loggedInUser = await UserModel.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(StatusCodes.OK)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options);

  return new ApiResponse(
    StatusCodes.OK,
    {
      user: loggedInUser,
      tokens: { accessToken, refreshToken },
    },
    "user logged in successfully"
  );
});
