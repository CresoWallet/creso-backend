import { Router } from "express";
import { AuthController } from "../controller/auth";
import { authenticateJwt } from "../middleware";
import passport from 'passport';

const router = Router();
const authController: AuthController = new AuthController();

/*
username, email, password 
*/
router.post("/register", authController.register);

router.post("/login", authController.login);

router.get("/authenticate", authenticateJwt, authController.authenticate);


// Twitter Auth Route
router.get('/auth/twitter', passport.authenticate('twitter'));

// Twitter Auth Callback Route
router.get('/auth/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login?error=twiiter' }),
    authController.loginTwitter
);

export { router as auth };
