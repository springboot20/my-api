import { getUserAccounts } from "./all-account/all.account.controller.js";
import {
  createAccount,
  generateAccountNumber,
} from "./create/create.account.controller.js";
import { deleteUserAccount } from "./delete/delete.account.controller.js";
import { getAccountDetails } from "./get-account/user.account.controller.js";

const accountController =
  {
    getAccountDetails,
    createAccount,
    deleteUserAccount,
    getUserAccounts,
    generateAccountNumber,
  };

export default accountController;
