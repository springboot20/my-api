import { login } from "./login/login.controller.js";
import { register } from "./register/register.controller.js";
import { logout } from "./logout/logout.controller.js";
import {
  forgotPassword,
  refreshToken,
  verifyEmail,
  resendEmailVerification,
  resetPassword,
  changeCurrentPassword,
} from "./verification/verification.controller.js";
import {
  getUsers,
  getCurrentUser,
  getUserById,
  updateCurrentUserProfile,
} from "./users/users.controller.js";
import { createUserProfile, getUserProfile } from "./profile/profile.controller.js";

export {
  login,
  register,
  logout,
  forgotPassword,
  refreshToken,
  verifyEmail,
  resendEmailVerification,
  resetPassword,
  changeCurrentPassword,
  getUsers,
  getCurrentUser,
  createUserProfile,
  getUserProfile,
  getUserById,
  updateCurrentUserProfile,
};
