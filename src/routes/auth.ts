import { Router } from "express";
import { AuthController } from "../controller/auth";
import { authenticateJwt } from "../middleware";
import passportTwitter from "../config/twitter";
import passportGoogle from "../config/google";

const router = Router();
const authController: AuthController = new AuthController();

/*
username, email, password 
*/
// router.post("/register", authController.register);

router.post("/signup", authController.register);

router.post("/verify_email", authController.verifyEmail);

router.post("/resend_otp", authController.resendOtp);

router.post("/login", authController.login);

router.post("/logout", authController.logout);

router.get("/authenticate", authenticateJwt, authController.authenticate);

// TWITTER ROUTER //
router.get("/auth/twitter", passportTwitter.authenticate("twitter"));

router.get(
  "/auth/twitter/callback",
  passportTwitter.authenticate("twitter", {
    failureRedirect: "/login?error=twiiter",
  }),
  authController.socialLogin
);

// GOOGLE ROUTER //
router.get(
  "/auth/google",
  passportGoogle.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passportGoogle.authenticate("google", {
    failureRedirect: "/login",
  }),
  authController.socialLogin
);

router.post("/auth/2fa/enable", authenticateJwt, authController.enable2FA);

router.post("/auth/2fa/disable", authenticateJwt, authController.disable2FA);

router.post("/sendOTP", authenticateJwt, authController.sendOTPMail);

router.post("/verifyOTP", authenticateJwt, authController.verifyOTP);

export { router as auth };
