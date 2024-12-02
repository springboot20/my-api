import { body } from "express-validator";
import { AvailableAccountTypes } from "../../../constants.js";

export const createAccountSchema = () => [
  body("type")
    .notEmpty()
    .withMessage("required, account type cannot be empty!!!")
    .isIn(AvailableAccountTypes)
    .withMessage("Invalide account type"),
];
