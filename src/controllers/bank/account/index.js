import { getUserAccounts } from "./all-account/all.account.controller.js";
import { createAccount } from "./create/create.account.controller.js";
import { deleteUserAccount } from "./delete/delete.account.controller.js";
import { getUserAccount } from "./get-account/user.account.controller.js";

const accountController = {
  getUserAccount,
  createAccount,
  deleteUserAccount,
  getUserAccounts,
};

export default accountController;
