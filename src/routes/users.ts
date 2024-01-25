import { Router } from "express";
import { UserController } from "../controller/user";
import { authenticateJwt } from "../middleware";

const router = Router();
const userController: UserController = new UserController();

router.get("/users/me", authenticateJwt, userController.getCurrentUser);

router.put("/users/me", authenticateJwt, userController.updateUser);

router.put(
  "/users/change_password",
  authenticateJwt,
  userController.changePassword
);

export { router as user };
