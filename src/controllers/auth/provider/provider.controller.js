import { apiResponseHandler } from "../../../middleware/api/api.response.middleware.js";
import { UserModel } from "../../../models/index.js";
import { generateTokens } from "../../../utils/jwt.js";

export const handleSocialLogin = apiResponseHandler(async (req, res) => {
  try {
    const user = await UserModel.findById(req.user?._id);

    const clientRedirectUrl =
      process.env?.["NODE_ENV"] === "production"
        ? process.env?.["CLIENT_SSO_REDIRECT_URL_PROD"]
        : process.env?.["CLIENT_SSO_REDIRECT_URL_DEV"];

    if (!user) {
      return res.redirect(`${clientRedirectUrl}/error?reason=user-not-found`);
    }

    const { accessToken, refreshToken } = await generateTokens(user._id);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, cookieOptions);

    // const successRedirect =
    //   process.env?.["NODE_ENV"] === "production"
    //     ? process.env?.["BASE_URL_PROD"]
    //     : process.env?.["BASE_URL_DEV"];

    const loggedInUser = await UserModel.findById(user._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    return res.redirect(
      // redirect user to the frontend with access and refresh token in case user is not using cookies
      `${clientRedirectUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(
        JSON.stringify(loggedInUser)
      )}`
    );
  } catch (error) {
    console.error("Social login error:", error);
    const clientRedirectUrl =
      process.env?.["NODE_ENV"] === "production"
        ? process.env?.["CLIENT_SSO_REDIRECT_URL_PROD"]
        : process.env?.["CLIENT_SSO_REDIRECT_URL_DEV"];

    res.redirect(`${clientRedirectUrl}/error?reason=server-error`);
  }
});
