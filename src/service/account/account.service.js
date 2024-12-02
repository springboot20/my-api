import { AccountModel } from "../../models";

export default class AccountService {
  static generateAccountNumber = () => {
    let account_number = "";

    for (let i = 0; i < 10; i++) {
      account_number += Math.floor(Math.random() * 10);
    }

    return account_number;
  };

  static createAccountNumber = async () => {
    let account_number = "";
    while (account_number === "") {
      let account_num = this.generateAccountNumber();

      const existing_account_number = await AccountModel.findOne({ account_number: account_num });

      if (!existing_account_number) {
        account_number += account_num;
        break;
      }
    }

    return account_number;
  };
}
