import { apiResponseHandler } from "../../../middleware/api/api.response.middleware.js";
import { UserModel } from "../../../models/index.js";
import { generateTokens } from "../login/login.controller.js";

export const handleSocialLogin = apiResponseHandler(async (req, res) => {
  const user = await UserModel.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(301)
    .cookie("accessToken", accessToken, options) // set the access token in the cookie
    .cookie("refreshToken", refreshToken, options); // set the refresh token in the cookie
  // .redirect(
  //   // redirect user to the frontend with access and refresh token in case user is not using cookies
  //   `${process.env.CLIENT_SSO_REDIRECT_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`
  // );
});
