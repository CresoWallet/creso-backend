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

router.post(
  "/notifications",
  authenticateJwt,
  notificationController.sendPushNotification
);

router.post(
  "/notifications/transactions/:transaction_id/request_approval",
  authenticateJwt,
  notificationController.requestTxnApproval
);

router.post(
  "/transactions/:transaction_id/approve",
  authenticateJwt,
  notificationController.approveTransaction
);

router.post(
  "/notifications/transactions/:transaction_id/executed",
  authenticateJwt,
  notificationController.transactionExecuted
);

export { router as notification };
