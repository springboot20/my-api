/**
 * Available payment status
 */
const PaymentStatuses = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

const AvailablePaymentStatusEnums = Object.values(PaymentStatuses);

/**
 * Available wallet account status
 */
const AvailableAccountStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCK: "BLOCK",
};

const AvailableAccountStatusEnums = Object.values(AvailableAccountStatus);

/**
 * Available Transaction types
 */
const AvailableTransactionTypes = {
  DEPOSIT: "DEPOSIT",
  TRANSFER: "TRANSFER",
  WITHDRAW: "WITHDRAW",
};

const AvailableTransactionTypesEnum = Object.values(AvailableTransactionTypes);

/**
 * Available user roles
 */
const RoleEnums = {
  USER: "USER",
  ADMIN: "ADMIN",
};

const AvailableRoles = Object.values(RoleEnums);

/**
 * Available login types
 */
const LoginType = {
  EMAIL_PASSWORD: "EMAIL_PASSWORD",
  GOOGLE: "GOOGLE",
};

const AvailableLoginType = Object.values(LoginType);

/**
 * Available payment methods
 */
const PaymentMethods = {
  UNKNOWN: "UNKNOWN",
  BANK: "BANK",
  PAYSTACK: "PAYSTACK",
  FLUTTERWAVE: "FLUTTERWAVE",
};

const AvailablePaymentMethods = Object.values(PaymentMethods);

/**
 * Available currency
 */

const AvailableCurrencyTypes = {
  NGN: "NGN",
  USDT: "USDT",
};

const AvailableCurrencyTypesEnum = Object.values(AvailableCurrencyTypes);

export {
  AvailableCurrencyTypesEnum,
  AvailableCurrencyTypes,
  AvailableAccountStatusEnums,
  AvailableTransactionTypesEnum,
  AvailableTransactionTypes,
  AvailableAccountStatus,
  AvailablePaymentStatusEnums,
  PaymentStatuses,
  PaymentMethods,
  AvailablePaymentMethods,
  RoleEnums,
  AvailableRoles,
  LoginType,
  AvailableLoginType,
};
