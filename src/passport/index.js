import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { ProfileModel, UserModel } from "../models/index.js";
import { CustomErrors } from "../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { LoginType, RoleEnums } from "../constants.js";

import dotenv from "dotenv";

dotenv.config();

const getCallbackUrl = () => {
  return process.env.NODE_ENV === "production"
    ? process.env.GOOGLE_CALLBACK_URL_PROD
    : process.env.GOOGLE_CALLBACK_URL_DEV;
};

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

passport.serializeUser((user, callback) => {
  process.nextTick(() => {
    callback(null, user?._id);
  });
});

passport.deserializeUser((userId, callback) => {
  process.nextTick(async () => {
    try {
      const user = await UserModel.findById(userId);

      if (user) callback(null, user);
      else callback(new CustomErrors("User does not exist", StatusCodes.NOT_FOUND), null);
    } catch (error) {
      callback(
        new CustomErrors(
          "Something went wrong while deserializing the user. Error: " + error,
          StatusCodes.INTERNAL_SERVER_ERROR
        ),
        null
      );
    }
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL: getCallbackUrl(),
    },
    async (_, __, profile, callback) => {
      try {
        console.log(profile);

        const email = profile.emails?.[0]?.value || profile._json.email;

        if (!email) {
          return callback(null, false, {
            reason: "no-email",
            message:
              "No email provided by Google. Please ensure your Google account has an email address.",
          });
        }

        const user = await UserModel.findOne({ email });

        if (user) {
          if (user.loginType !== LoginType.GOOGLE) {
            return callback(null, false, {
              reason: "wrong-login-method",
              message: `You have previously registered using ${user.loginType
                ?.toLowerCase()
                ?.split("_")
                .join(" ")}. Please use the ${user.loginType
                ?.toLowerCase()
                ?.split("_")
                .join(" ")} login option to access your account.`,
            });
          }

          // Update user info from Google (in case profile changed)
          user.avatar = user.avatar || {
            url: profile.photos?.[0]?.value || profile._json?.picture,
            localPath: "",
          };
          await user.save();

          return callback(null, user);
        } else {
          const createdUser = await UserModel.create({
            email: profile._json.email,
            // There is a check for traditional logic so the password does not matter in this login method
            password: profile._json.sub, // Set user's password as sub (coming from the google)
            lastname: profile._json.family_name,
            firstname: profile._json.given_name,
            role: RoleEnums.USER,
            avatar: {
              url: profile._json.picture,
              localPath: "",
            }, // set avatar as user's google picture
            loginType: LoginType.GOOGLE,
          });

          if (createdUser) {
            await ProfileModel.create({
              userId: createdUser?._id,
              username: `@${profile._json.email?.split("@")[0]}` ?? profile._json.name,
              isEmailVerified: profile._json.email_verified, // email will be already verified
              role: RoleEnums.USER,
            });

            return callback(null, createdUser);
          } else {
            return callback(
              new CustomErrors(
                "Error while registering the user",
                StatusCodes.INTERNAL_SERVER_ERROR
              ),
              null
            );
          }
        }
      } catch (error) {
        callback(error, null);
      }
    }
  )
);

export default passport;
