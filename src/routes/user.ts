import { Router } from "express";
import { UserController } from "../controller/user";
import { authenticateJwt } from "../middleware";

const router = Router();
const userController: UserController = new UserController();

router.post("/sendOTP", authenticateJwt, userController.sendOTPMail);

router.post("/verifyOTP", authenticateJwt, userController.verifyOTP);

export { router as user };
