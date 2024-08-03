import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { UserModel } from "../../../models/index.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { uploadFileToCloudinary } from "../../../configs/cloudinary.config.js";
import { multerUploads } from "../../../middleware/upload/upload.middleware.js";

export const upload = multerUploads.fields([
  {
    name: "avatar",
    maxCount: 1,
  },
]);

export const uploadAvatar = apiResponseHandler(async (req, res) => {
  if (!req.files.avatar) {
    throw new CustomErrors("avatar image is required", StatusCodes.NOT_FOUND);
  }

  let uploadImage;

  if (req.files) {
    uploadImage = await uploadFileToCloudinary(
      req.files.avatar.buffer,
      "initial",
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
  ).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  console.log({ updatedUserAvatar });

  return new ApiResponse(StatusCodes.OK, "avatar updated successfully", {
    updatedUserAvatar,
  });
});
