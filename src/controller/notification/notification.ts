import { NextFunction, Request, Response } from "express";
import AppError from "../../errors/app";
import { prisma } from "../../services/prisma";
import bcrypt from "bcrypt";

export class NotificationController {
  public async registerDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { deviceToken, platform } = req.body;
      const userId = req.user?.id;

      if (!userId) throw new Error("not authenticated");

      const device = await prisma.device.create({
        data: {
          deviceToken,
          platform,
          userId,
        },
      });

      res
        .status(200)
        .send({ data: device, message: "Successfully device added" });
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
}
