import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { TransactionModel } from "../../../../models/index.js";
import { checkPermissions } from "../../../../utils/permissions.js";
import { RoleEnums } from "../../../../constants.js";

export const getAllTransactions = apiResponseHandler(async (req, res) => {
  checkPermissions(RoleEnums.ADMIN);

  const {} = req.body;
});
