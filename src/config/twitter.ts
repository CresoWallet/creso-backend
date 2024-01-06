import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { prisma } from "../services/prisma";
import {
  TWITTER_CALLBACK,
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
} from "../constant";
import { createSocialUser } from "../utils/social";

passport.use(
  new TwitterStrategy(
    {
      consumerKey: TWITTER_CONSUMER_KEY,
      consumerSecret: TWITTER_CONSUMER_SECRET,
      callbackURL: TWITTER_CALLBACK,
      includeEmail: true,
    },
    async (token, tokenSecret, profile, done) => {
      try {
        const user = await createSocialUser({
          id: profile.id,
          username: profile.username,
          email: profile._json.email.toLowerCase(),
          registrationMethod: "twitter",
          isEmailVerified: false,
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
