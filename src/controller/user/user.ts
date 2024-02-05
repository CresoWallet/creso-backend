import { NextFunction, Request, Response } from "express";
import AppError from "../../errors/app";
import { prisma } from "../../services/prisma";
import bcrypt from "bcrypt";

export class UserController {
  public async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = await prisma.user.findUnique({
        where: { id: req.user?.id },
        select: {
          email: true,
          username: true,
          registrationMethod: true,
        },
      });

      if (!userData) throw new AppError("User not found", 404);

      res.status(200).send(userData);
    } catch (err: any) {
      next(err);
    }
  }

  public async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userData } = req.body;

      const updateUser = await prisma.user.update({
        where: {
          id: req.user?.id,
        },
        data: userData,
      });

      if (!userData) throw new AppError("User not found", 404);

      res.status(200).send(updateUser);
    } catch (err: any) {
      next(err);
    }
  }

  public async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("not authenticated");
      }

      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: req.user?.id },
        select: {
          password: true,
        },
      });

      if (!user || !user.password) throw new AppError("User not found", 404);

      const isCurrentPasswordMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordMatch)
        throw new AppError("Current password doesn't match", 404);

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatedUser = await prisma.user.update({
        where: {
          id: req.user?.id,
        },
        data: {
          password: hashedPassword,
        },
      });

      res.status(200).send(updatedUser);
    } catch (err: any) {
      next(err);
    }
  }

  public async initiateAction(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("not authenticated");
      }

      const { action_type } = req.params;
      if (action_type === "send_transaction") {
        const initiateTxn = await prisma.notification.create({
          data: {
            type: "send-transaction",
            transactionStatus: "pending",
            userId: req.user.id,
          },
        });

        res.status(200).send(initiateTxn);
      } else {
        res.status(404).send({ message: "invalid params" });
      }
    } catch (err: any) {
      next(err);
    }
  }

  public async approveAction(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("not authenticated");
      }

      const { confirmation_request_id } = req.params;

      // const updateNotification = await prisma.notification.update({
      //   where:{

      //   }
      //   data: {
      //     type: "send-transaction",
      //     transactionStatus: "pending",
      //     userId: req.user.id,
      //   },
      // });
    } catch (err: any) {
      next(err);
    }
  }
}
