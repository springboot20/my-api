/**
 * Available payment status
 */
const PaymentStatuses = {
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

const paystackStatus = {
  success: "success",
};

const AvailablePaymentStatusEnums = Object.values(PaymentStatuses);

/**
 * Available wallet account status
 */
const AvailableAccountStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  CLOSED: "CLOSED",
  SUSPENDED: "SUSPENDED",
};

/**
 * Available wallet account status
 */
const AvailableCardStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCK: "BLOCK",
};

const AvailableAccountStatusEnums = Object.values(AvailableAccountStatus);
const AvailableCardStatusEnums = Object.values(AvailableCardStatus);

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
  MODERATOR: "MODERATOR",
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

/**
 * Avaliable account type
 */

const AvailableAccountTypes = {
  SAVINGS: "SAVINGS",
  CURRENT: "CURRENT",
  NONE: "NONE",
};

/**
 * Avaliable card type
 */

const AvailableCardTypes = {
  MASTER_DEBIT: "MASTER DEBIT",
  MASTER_CREDIT: "MASTER CREDIT",
  VERVE_DEBIT: "VERVE DEBIT",
  VERVE_CREDIT: "VERVE CREDIT",
};

const AvailableAccountEnums = Object.values(AvailableAccountTypes);
const AvailableCardEnums = Object.values(AvailableCardTypes);

const paystack_urls = {
  initiate: "https://api.paystack.co/transaction/initialize",
  verify: "https://api.paystack.co/transaction/verify",
};

const AvailableRequestPriorities = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
};

const AvailableRequestActions = {
  CLOSE: "CLOSE_ACCOUNT",
  SUSPEND: "SUSPEND_ACCOUNT",
  UNSUSPEND: "UNSUSPEND_ACCOUNT",
  UNCLOSE: "UNCLOSE_ACCOUNT",
};

const AvailableRequestStatus = {
  PENDING: "PENDING",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const AvailableRequestStatusEnums = Object.values(AvailableRequestStatus);
const AvailableRequestActionsEnums = Object.values(AvailableRequestActions);
const AvailableRequestPrioritiesEnums = Object.values(AvailableRequestPriorities);

const AvailableRequestMessageTypes = {
  NEW_REQUEST: "NEW_REQUEST",
  STATUS_UPDATE: "STATUS_UPDATE",
  ADMIN_RESPONSE: "ADMIN_RESPONSE",
  WARNING: "WARNING",
  APPROVAL_REQUIRED: "APPROVAL_REQUIRED",
  DEADLINE_REMINDER: "DEADLINE_REMINDER",
  SYSTEM_MAINTENANCE: "SYSTEM_MAINTENANCE",
  SECURITY_ALERT: "SECURITY_ALERT",
  SYSTEM_UPDATE: "SYSTEM_UPDATE",
  INFO: "INFO",
};

const AvaliableRequestMessageTypesEnums = Object.values(AvailableRequestMessageTypes);

export {
  paystack_urls,
  paystackStatus,
  AvailableAccountTypes,
  AvailableAccountEnums,
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
  AvailableCardTypes,
  AvailableCardEnums,
  AvailableCardStatus,
  AvailableCardStatusEnums,
  AvailableRequestStatus,
  AvailableRequestStatusEnums,
  AvailableRequestActions,
  AvailableRequestActionsEnums,
  AvailableRequestPriorities,
  AvailableRequestPrioritiesEnums,
  AvailableRequestMessageTypes,
  AvaliableRequestMessageTypesEnums,
};
