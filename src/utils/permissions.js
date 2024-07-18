import { UnAuthenticated } from '@middleware/custom/custom.errors';
import { UserModel } from '@models/index';

/**
 *
 * @description utility function which handles role permissions
 * @param {string[]} roles
 */
const checkPermissions = (...roles) => {
  return (req, res, next) => {
    if (Array.isArray(roles) && !roles.includes(req.user.role)) {
      throw new UnAuthenticated('UnAuthenticated to access this route');
    }
    next();
  };
};

/**
 *
 * @param {UserModel} requestUser
 * @param {mongoose.ObjectId} resourceUserId
 */
const checkPermission = (requestUser, resourceUserId) => {
  if (requestUser.role === 'admin') return;
  if (requestUser._id === resourceUserId.toString()) return;
  throw new UnAuthorized('Not authorized to access this route');
};

export { checkPermissions, checkPermission };
