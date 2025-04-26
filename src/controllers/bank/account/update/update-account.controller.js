import { AvailableAccountStatusEnums } from "../../../../constants.js";
import {
  apiResponseHandler,
  ApiResponse,
} from "../../../../middleware/api/api.response.middleware.js";
import { CustomErrors } from "../../../../middleware/custom/custom.errors.js";
import { AccountModel } from "../../../../models/index.js";
import { StatusCodes } from "http-status-codes";

/**
 * Update account status
 */
export const updateAccountStatus = apiResponseHandler(async (req, res) => {
  const userId = req.user?._id;
  const { accountId } = req.params;
  const { status } = req.body;

  // Validate status value
  if (!AvailableAccountStatusEnums.includes(status)) {
    throw new CustomErrors(`Invalid status value`, StatusCodes.BAD_REQUEST);
  }

  // Find and update the account
  const updatedAccount = await AccountModel.findOneAndUpdate(
    { _id: accountId, user: userId },
    { status },
    { new: true }
  );

  if (!updatedAccount) {
    throw new CustomErrors(`Account not found or unauthorized`, StatusCodes.NOT_FOUND);
  }

  return new ApiResponse(
    StatusCodes.OK,
    { account: updatedAccount },
    `Account status updated to ${status}`
  );
});
