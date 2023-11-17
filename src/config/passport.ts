import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { prisma } from '../services/prisma';
import { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET } from '../constant/auth';


passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "http://localhost:8080/api/twitter/callback"
},
    async (token, tokenSecret, profile, done) => {
        console.log("token")
        console.log(token)
        console.log("tokenSecret")
        console.log(tokenSecret)
        console.log("profile")
        console.log(profile)
        try {
            // Check if a user with this Twitter ID already exists
            let user = await prisma.user.findUnique({
                where: { twitterId: profile.id }
            });

            if (!user) {
                // Create a new user if one doesn't exist
                // user = await prisma.user.create({
                //     data: {
                //         twitterId: profile.id,
                //         username: profile.username,
                //         // Other fields as necessary
                //     }
                // });
            }

            done(null, user);
        } catch (error) {
            done(error);
        }
    }
));

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
