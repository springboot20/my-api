import { v2 } from "cloudinary";
import { CustomErrors } from "../middleware/custom/custom.errors.js";
import dotenv from "dotenv";

dotenv.config()

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
          resolve(result.secure_url);
        }
      })
      .end(buffer);
  });
};

export { uploadFileToCloudinary };
