const customErrors = require('../middleware/customErrors');

const checkPermissions = (...roles) => {
  return (req, res, next) => {
    if (Array.isArray(roles) && !roles.includes(req.user.role)) {
      throw new customErrors.UnAuthenticated('UnAuthenticated to access this route');
    }
    next();
  };
};

const checkPermission = (requestUser, resourceUserId) => {
  if (requestUser.role === 'admin') return;
  if (requestUser.userId === resourceUserId.toString()) return;
  throw new customErrors.UnAuthorized('Not authorized to access this route');
};

module.exports = {
  checkPermissions,
  checkPermission,
};
