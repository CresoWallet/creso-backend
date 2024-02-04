import { NextFunction, Request, Response } from "express";
import AppError from "../../errors/app";
import { prisma } from "../../services/prisma";
import { sendEmail } from "../../services/email";
import { detectDevice } from "../../utils/deviceDetect";

export class NotificationController {
  public async registerDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new Error("not authenticated");

      const result = await detectDevice(req, res, next);

      if (!result) throw new Error("couldn't find a device");

      const addedDevice = await prisma.device.create({
        data: {
          device: result.device as any,
          os: result.os as any,
          client: result.client as any,
          userId,
        },
      });
      res
        .status(200)
        .send({ data: addedDevice, message: "Successfully device added" });
    } catch (err: any) {
      next(err);
    }
  }

  public async unregisterDevice(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { device_id } = req.params;

      const deleteUser = await prisma.device.delete({
        where: {
          id: device_id,
        },
      });

      if (!deleteUser) throw new AppError("Couldn't unregister device", 404);

      res
        .status(200)
        .send({ data: deleteUser, message: "Successfully unregister device" });
    } catch (err: any) {
      next(err);
    }
  }

  public async sendPushNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const email = req.user?.email;

      if (!userId) throw new AppError("not authenticated", 404);

      if (!email)
        throw new AppError(
          "To send mail, the user requires a mail address!",
          404
        );

      const devices = await prisma.device.findMany({
        where: { userId },
      });

      if (!devices)
        throw new AppError("The user has not yet registered any devices!", 404);

      await prisma.notification.create({
        data: {
          type: "push-notification",
          data: "devices",
          userId,
        },
      });

      const emailResponse = await sendEmail({
        receivers: [email],
        template_name: "push-notification",
        devices,
      });
      if (emailResponse) {
        res.status(200).send({
          message: "A OTP mail has been sent ",
        });
      }

      res.status(200).send({
        data: emailResponse,
        message: "Successfully sent email",
      });
    } catch (err: any) {
      next(err);
    }
  }

  public async requestTxnApproval(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;
      if (!userId) throw new AppError("not authenticated", 404);

      if (!userEmail)
        throw new AppError(
          "User doesn't have any mail address to send mail",
          404
        );

      const EOALoggedInDevice = await prisma.device.findFirst({
        where: {
          userId,
          isEOALoggedIn: true,
        },
      });

      if (!EOALoggedInDevice)
        throw new AppError("couldn't find a main device", 404);

      const emailResponse = await sendEmail({
        receivers: [userEmail],
        template_name: "request-transaction-approval",
        platform: EOALoggedInDevice?.device,
      });

      if (emailResponse) {
        res.status(200).send({
          message: "A mail has been sent ",
        });
      }
    } catch (err: any) {
      next(err);
    }
  }

  public async transactionExecuted(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;
      const transaction_id = req.params;
      if (!userId) throw new AppError("not authenticated", 404);

      if (!userEmail)
        throw new AppError(
          "User doesn't have any mail address to send mail",
          404
        );

      const EOALoggedInDevice = await prisma.device.findFirst({
        where: {
          userId,
          isEOALoggedIn: true,
        },
      });

      if (!EOALoggedInDevice)
        throw new AppError("couldn't find a main device", 404);

      const emailResponse = await sendEmail({
        receivers: [userEmail],
        template_name: "initiated-transaction",
        txnId: transaction_id,
      });

      if (emailResponse) {
        res.status(200).send({
          message: "A mail has been sent ",
        });
      }
    } catch (err: any) {
      next(err);
    }
  }
}
