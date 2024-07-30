import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { UserModel } from "../../../models/index.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { uploadFileToCloudinary } from "../../../configs/cloudinary.config.js";
import { multerUploads } from "../../../middleware/upload/upload.middleware.js";

export const upload = multerUploads.single("avatar");

export const uploadAvatar = apiResponseHandler(async (req, res, session) => {
  if (!req.file) {
    throw new CustomErrors("no file uploaded", StatusCodes.NOT_FOUND);
  }

  if (req.file) {
    const uploadImage = await uploadFileToCloudinary(
      req.file.buffer,
      "initial",
    );

    req.body.avatar = uploadImage;
  }

  const updatedUserAvatar = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: req.body.avatar },
    },
    { new: true, runvalidators: true },
  ).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  console.log({ updatedUserAvatar });

  return new ApiResponse(StatusCodes.OK, "avatar updated successfully", {
    updatedUserAvatar,
  });
});
