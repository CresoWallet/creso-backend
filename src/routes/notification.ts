import { Router } from "express";
import { NotificationController } from "../controller/notification";
import { authenticateJwt } from "../middleware";

const router = Router();
const notificationController: NotificationController =
  new NotificationController();

router.post(
  "/notifications/devices",
  authenticateJwt,
  notificationController.registerDevice
);

router.delete(
  "/notifications/devices/:device_id",
  authenticateJwt,
  notificationController.unregisterDevice
);

export { router as notification };
