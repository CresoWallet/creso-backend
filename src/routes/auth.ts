import { Router } from "express";
import { AuthController } from "../controller/auth";
import { authenticateJwt } from "../middleware";
import passport from 'passport';
import '../config/passport';

const router = Router();
const authController: AuthController = new AuthController();

/*
username, email, password 
*/
router.post("/register", authController.register);

router.post("/login", authController.login);

router.get("/authenticate", authenticateJwt, authController.authenticate);


// Twitter Auth Route
router.get('/twitter', passport.authenticate('twitter'));

// Twitter Auth Callback Route
router.get('/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, redirect home or another page
        res.redirect('/');
    }
);

export { router as auth };
