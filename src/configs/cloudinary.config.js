import { v2 } from "cloudinary";
import { CustomErrors } from "../middleware/custom/custom.errors.js";
import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";

dotenv.config();

v2.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_NAME,
});

const uploadFileToCloudinary = async (buffer, folder) => {
  return new Promise((resolve, reject) => {
    v2.uploader
      .upload_stream({ resource_type: "auto", folder }, (error, result) => {
        if (error) {
          reject(new CustomErrors(error.message, null));
        } else {
          resolve(result);
        }
      })
      .end(buffer);
  });
};

const deleteFileFromCloudinary = async (public_id) => {
  try {
    const deletedResource = await v2.uploader.destroy(public_id, (error, result) => {
      if (error) {
        throw new CustomErrors(error.message, StatusCodes.BAD_REQUEST);
      } else {
        return result;
      }
    });

    if (deletedResource.result === "not found") {
      throw new CustomErrors(
        "Public ID not found. Provide a valid publicId.",
        StatusCodes.BAD_REQUEST,
      );
    }
    if (deletedResource.result !== "ok") {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error while deleting existing file. Try again.",
      );
    }
  } catch (error) {
    // Wrap errors with ApiError for consistent error handling
    throw error instanceof CustomErrors
      ? error
      : new CustomErrors(error.message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export { uploadFileToCloudinary, deleteFileFromCloudinary };
