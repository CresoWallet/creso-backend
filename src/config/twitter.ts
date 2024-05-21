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
      scope: ["user_read", "user_write"],

    },
    async (token, tokenSecret, profile, done) => {
      console.log("Profile:///", profile);
      try {
        const user = await createSocialUser({
          id: profile?.id,
          username: profile?.username,
          email: profile.emails[0]?.value || profile._json.email,
          registrationMethod: "twitter",
          isEmailVerified: true,
        });
      console.log("twitter user",user);
console.log("************");
        done(null, user);
      } catch (error) {
        console.log("+++++++++++++",error);
        if(error.message == "Failed to find request token in session"){
          console.log("error log ***********", error);
          window.location.reload();
          
        } 
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
