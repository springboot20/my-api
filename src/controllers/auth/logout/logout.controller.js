import { StatusCodes } from "http-status-codes";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { UserModel } from "../../../models/index.js";

export const logout = apiResponseHandler(async (req, res) => {
  await UserModel.findOneAndUpdate(
    { _id: req.user._id },
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options);

  return new ApiResponse(StatusCodes.OK, {}, "you have successfully logged out");
});
