import { StatusCodes } from "http-status-codes";
import {
  ApiResponse,
  apiResponseHandler,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { UserModel } from "../../../models/index.js";
import { generateTokens } from "../../../utils/jwt.js";

export const handleSocialLogin = apiResponseHandler(async (req, res) => {
  const user = await UserModel.findById(req.user?._id);

  if (!user) {
    throw new CustomErrors("User does not exist", StatusCodes.NOT_FOUND);
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  const client_sso_redirect_url =
    process.env?.["NODE_ENV"] === "production"
      ? process.env?.["CLIENT_SSO_REDIRECT_URL_PROD"]
      : process.env?.["CLIENT_SSO_REDIRECT_URL_DEV"];

  const loggedInUser = await UserModel.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  return res
    .status(301)
    .cookie("accessToken", accessToken, options) // set the access token in the cookie
    .cookie("refreshToken", refreshToken, options) // set the refresh token in the cookie
    .redirect(
      // redirect user to the frontend with access and refresh token in case user is not using cookies
      `${client_sso_redirect_url}?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(
        JSON.stringify(loggedInUser)
      )}`
    );
});
