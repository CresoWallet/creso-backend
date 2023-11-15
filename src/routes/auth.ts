import { Router } from "express";
import { AuthController } from "../controller/auth";
import { authenticateJwt } from "../middleware";

const router = Router();
const authController: AuthController = new AuthController();

/*
username, email, password 
*/
router.post("/register", authController.register);

router.post("/login", authController.login);


router.get("/authenticate", authenticateJwt, authController.authenticate);





export { router as auth };
