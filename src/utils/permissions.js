import { CustomErrors } from "../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";

export const checkPermissions = (...roles) => {
  return (req, res, next) => {
    if (Array.isArray(roles) && !roles.includes(req?.user.role)) {
      throw new CustomErrors(
        "UnAuthenticated to access this route",
        StatusCodes.UNAUTHORIZED
      );
    }
    next();
  };
};
