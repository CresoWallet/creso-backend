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

router.post(
  "/actions/:action_type",
  authenticateJwt,
  userController.initiateAction
);

router.post(
  "/actions/:confirmation_request_id/approve",
  authenticateJwt,
  userController.approveAction
);

export { router as user };
