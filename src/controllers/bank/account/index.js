import { getUserAccounts } from "./all-account/all.account.controller.js";
import { createAccount, validateAccountNumber } from "./create/create.account.controller.js";
import { deleteUserAccount } from "./delete/delete.account.controller.js";
import { getAccountDetails } from "./get-account/user.account.controller.js";
import { updateAccountStatus,adminUpdateAccountStatus } from "./update/update-account.controller.js";

const accountController = {
  getAccountDetails,
  createAccount,
  deleteUserAccount,
  getUserAccounts,
  updateAccountStatus,
  validateAccountNumber,
  adminUpdateAccountStatus
};

export default accountController;
