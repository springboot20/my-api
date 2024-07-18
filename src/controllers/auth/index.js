import { login } from './login/login.controller';
import { register } from './register/register.controller';
import { logout } from './logout/logout.controller';
import { forgotPassword, refreshToken,verifyEmail, resendEmailVerification,resetPassword,changeCurrentPassword  } from './verification/verify.controller';

export { login, register, logout, forgotPassword, refreshToken,verifyEmail ,resendEmailVerification,resetPassword,changeCurrentPassword};
