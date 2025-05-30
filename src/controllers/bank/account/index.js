import { getUserAccounts, getUsersAccounts } from "./all-account/all.account.controller.js";
import { createAccount, validateAccountNumber } from "./create/create.account.controller.js";
import { adminDeleteUserAccount,closeAccount } from "./delete/delete.account.controller.js";
import {
  getAccountDetails,
  adminGetAccountDetails,
} from "./get-account/user.account.controller.js";
import {
  updateAccountStatus,
  adminUpdateAccountStatus,
} from "./update/update-account.controller.js";

const accountController = {
  getAccountDetails,
  createAccount,
  adminDeleteUserAccount,
  getUserAccounts,
  updateAccountStatus,
  validateAccountNumber,
  adminUpdateAccountStatus,
  getUsersAccounts,
  adminGetAccountDetails,
  closeAccount
};

export default accountController;
