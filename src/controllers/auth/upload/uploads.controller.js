import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { UserModel } from "../../../models/index.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import {
  deleteFileFromCloudinary,
  uploadFileToCloudinary,
} from "../../../configs/cloudinary.config.js";
import { multerUploads } from "../../../middleware/upload/upload.middleware.js";

export const upload = multerUploads.single("avatar");

export const uploadAvatar = apiResponseHandler(async (req, res) => {
  const user = await UserModel.findById(req.user?._id);

  if (!user) throw new CustomErrors("user not found", StatusCodes.NOT_FOUND);

  if (!req.file) {
    throw new CustomErrors("avatar image is required", StatusCodes.NOT_FOUND);
  }

  let uploadImage;

  if (req.file) {
    if (user?.avatar?.public_id !== null) {
      await deleteFileFromCloudinary(user?.avatar?.public_id);
    }

    uploadImage = await uploadFileToCloudinary(
      req.file.buffer,
      `${process.env.CLOUDINARY_BASE_FOLDER}/users-image`,
    );
  }

  const updatedUserAvatar = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: {
          url: uploadImage.secure_url,
          public_id: uploadImage.public_id,
        },
      },
    },
    { new: true, runvalidators: true },
  ).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");

  console.log({ updatedUserAvatar });

  return new ApiResponse(StatusCodes.OK, "avatar updated successfully", {
    user: updatedUserAvatar,
  });
});
