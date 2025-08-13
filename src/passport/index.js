import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { ProfileModel, UserModel } from "../models/index.js";
import { CustomErrors } from "../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { LoginType, RoleEnums } from "../constants.js";

import dotenv from "dotenv";

dotenv.config();

const callback_url =
  process.env.NODE_ENV === "production"
    ? process.env.GOOGLE_CALLBACK_URL_PROD
    : process.env.GOOGLE_CALLBACK_URL_DEV;
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

console.log(callback_url, clientID, clientSecret);

try {
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
        next(
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
        callbackURL: callback_url,
      },
      async (_, __, profile, callback) => {
        console.log(profile);

        const user = await UserModel.findOne({ email: profile._json.email });

        if (user) {
          if (user.loginType !== LoginType.GOOGLE) {
            callback(
              new CustomErrors(
                `You have previously registered using ${user.loginType
                  ?.toLowerCase()
                  ?.split("_")
                  .join(" ")}. Please use the ${user.loginType
                  ?.toLowerCase()
                  ?.split("_")
                  .join(" ")} login option to access your account.`,
                StatusCodes.BAD_REQUEST
              ),
              null
            );
          } else {
            callback(null, user);
          }
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
            loginType: LoginType.GOOGLE.toLowerCase(),
          });

          if (createdUser) {
            next(null, createdUser);

            await ProfileModel.create({
              userId: createdUser?._id,
              username: `@${profile._json.email?.split("@")[0]}` ?? profile._json.name,
              isEmailVerified: profile._json.email_verified, // email will be already verified
              role: RoleEnums.USER,
            });
          } else {
            next(new ApiError(500, "Error while registering the user"), null);
          }
        }
      }
    )
  );
} catch (error) {
  console.error("PASSPORT ERROR: ", error);
}

export default passport;
