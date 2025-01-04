import { StatusCodes } from "http-status-codes";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../middleware/custom/custom.errors.js";
import { ProfileModel } from "../../../models/index.js";
import { sendMail } from "../../../service/email.service.js";
import { RoleEnums } from "../../../constants.js";

export const CreateUserProfile = apiResponseHandler(async (req, res) => {
  const {} = req.body;
});
