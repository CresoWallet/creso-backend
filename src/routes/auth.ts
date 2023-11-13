import { Router } from "express";
import { AuthController } from "../controller/auth";

const router = Router();
const authController: AuthController = new AuthController();

/*
username, email, password 
*/
router.post("/register", authController.register);

router.post("/login", authController.login);





export { router as auth };
