import { body } from "express-validator";
import { AvailableRoles } from "../../../constants.js";

const userRegisterValidation = () => {
  return [
    body("firstname").trim().notEmpty().withMessage("firstname is required").toLowerCase(),
    body("lastname").trim().notEmpty().withMessage("lastname is required").toLowerCase(),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .normalizeEmail()
      .withMessage("email must be an email")
      .toLowerCase(),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("password is required")
      .isLength({ min: 5 })
      .withMessage("password should be a minimum of 3 "),
    body("role").optional().trim().isIn(AvailableRoles).withMessage("Invalid user role"),
    body("phone_number").optional(),
  ];
};

const userLoginValidation = () => {
  return [
    body("username").optional(),
    body("email").optional().isEmail().withMessage("Email is invalid"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ];
};

const userValidation = () => {
  return [body("email").isEmail().withMessage("Email is invalid")];
};

const userResetPasswordValidation = () => {
  return [body("password").trim().notEmpty().withMessage("Password is require")];
};

const userAssignRoleValidation = () => {
  return [body("role").trim().optional().isIn(AvailableRoles).withMessage("Invalid user role")];
};

const userChangeCurrentPasswordValidation = () => {
  return [
    body("existingPassword").notEmpty().withMessage("Existing password is require"),
    body("newPassword").notEmpty().withMessage("New password is require"),
  ];
};

const userProfileUpdateValidation = () => {
  return [
    body("username").trim().notEmpty().withMessage("Username is required").toLowerCase(),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .normalizeEmail()
      .withMessage("Email must be an email")
      .toLowerCase(),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 3 })
      .withMessage("Password should be a minimum of 3 "),
    body("role").optional().trim().isIn(AvailableRoles).withMessage("Invalid user role"),
  ];
};

export {
  userRegisterValidation,
  userLoginValidation,
  userValidation,
  userResetPasswordValidation,
  userAssignRoleValidation,
  userChangeCurrentPasswordValidation,
  userProfileUpdateValidation,
};
