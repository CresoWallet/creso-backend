import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import { prisma } from "../services/prisma";
import {
  GOOGLE_CALLBACK,
  GOOGLE_CONSUMER_KEY,
  GOOGLE_CONSUMER_SECRET,
} from "../constant";
import { createSocialUser } from "../utils/social";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CONSUMER_KEY,
      clientSecret: GOOGLE_CONSUMER_SECRET,
      callbackURL: GOOGLE_CALLBACK,
      //   passReqToCallback: true,
    },
    async (token, tokenSecret, profile, done) => {
      try {
        const user = await createSocialUser({
          id: profile.id,
          username: profile.given_name,
          email: profile.email,
          registrationMethod: "google",
          isEmailVerified: true,
        });

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
