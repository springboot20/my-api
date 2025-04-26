import { AccountModel, CardModel } from "../models/index.js";

export default class AccountService {
  /**
   * Create a new unique account number
   * @returns {Promise<string>} A unique account number
   */
  static async createAccountNumber() {
    return this.generateUniqueAccountNumber();
  }

  /**
   * Check if an account number is valid and unique
   * @param {string} accountNumber - The account number to validate
   * @returns {Promise<boolean>} Whether the account number is valid and unique
   */
  static async isAccountNumberValid(accountNumber) {
    // Format validation
    if (!this.validateAccountNumber(accountNumber)) {
      return false;
    }

    // Check uniqueness
    const existingAccount = await AccountModel.findOne({ account_number: accountNumber });
    return !existingAccount;
  }

  /**
   * Generates a random number of specified length
   * @param {number} length - The length of the number to generate
   * @param {boolean} includeLeadingZeros - Whether to include leading zeros
   * @returns {string} The generated number as string
   */
  static generateUniqueNumber = (length = 10, includeLeadingZeros = false) => {
    let result = "";

    // First digit shouldn't be zero for most financial numbers
    if (!includeLeadingZeros && length > 0) {
      result += Math.floor(Math.random() * 9) + 1; // 1-9
      length--;
    }

    // Generate the remaining digits
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10); // 0-9
    }

    return result;
  };

  /**
   * Validate account number format (additional validation if needed)
   * @param {string} accountNumber - The account number to validate
   * @returns {boolean} Whether the account number is valid
   */
  static validateAccountNumber = (accountNumber) => {
    // Basic validation - you can enhance this
    return accountNumber && accountNumber.length === 10 && /^\d+$/.test(accountNumber);
  };

  /**
   * Generate a unique account number that doesn't exist in the database
   * @returns {Promise<string>} A unique account number
   */
  static generateUniqueAccountNumber = async () => {
    let isUnique = false;
    let accountNumber = "";

    while (!isUnique) {
      accountNumber = generateUniqueNumber(10);

      // Check if this account number already exists
      const existingAccount = await AccountModel.findOne({ account_number: accountNumber });

      if (!existingAccount) {
        isUnique = true;
      }
    }

    return accountNumber;
  };

  /**
   * Generate a unique card number with proper formatting
   * @returns {Promise<string>} A unique 16-digit card number
   */
  static generateUniqueCardNumber = async () => {
    let isUnique = false;
    let cardNumber = "";

    while (!isUnique) {
      // Generate a 16-digit card number
      // You can customize the prefix based on card types (e.g., 4 for Visa)
      cardNumber = generateUniqueNumber(16);

      // Check if this card number already exists
      const existingCard = await CardModel.findOne({ card_number: cardNumber });

      if (!existingCard) {
        isUnique = true;
      }
    }

    return cardNumber;
  };

  /**
   * Generate a card expiration date that's valid for the next N years
   * @param {number} yearsValid - Number of years the card will be valid for
   * @returns {string} Expiration date in MM/YY format
   */
  static generateCardExpiryDate = (yearsValid = 3) => {
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setFullYear(today.getFullYear() + yearsValid);

    const month = (expiryDate.getMonth() + 1).toString().padStart(2, "0");
    const year = expiryDate.getFullYear().toString().slice(-2);

    return `${month}/${year}`;
  };

  /**
   * Generate a random CVV number
   * @returns {string} A 3-digit CVV
   */
  static generateCVV = () => {
    return generateUniqueNumber(3).toString().padStart(3, "0");
  };
}
