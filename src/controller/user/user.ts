import { NextFunction, Request, Response } from "express";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";
import { EMAIL_ACCESS_PASSWORD, USER_EMAIL } from "../../constant";

export class UserController {
  public async sendOTPMail(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;

    console.log("email : ", email);
    const generatedOTP = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: USER_EMAIL,
        pass: EMAIL_ACCESS_PASSWORD,
      },
    });

    var mailOptions = {
      from: USER_EMAIL,
      to: email as any,
      subject: "Sending Email using Node.js",
      text: `Here is the verification code. Please copy it and verify your Email ${generatedOTP}`,
    };

    //TODO: create a encrypted token
    const token = jwt.sign(
      {
        email,
        generatedOTP,
        expireAt: new Date().getTime() + 5 * 60000,
      },
      JWT_SECRET
    );

    try {
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          res.status(400).send({ message: "Error sending OTP email" });
        } else {
          res.status(200).send({
            message: "A OTP mail has been sent ",
            token: token,
          });
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  public async verifyOTP(req: Request, res: Response, next: NextFunction) {
    const { otp, token } = req.body;

    try {
      const { expireAt, generatedOTP }: any = await jwt.verify(
        token,
        JWT_SECRET
      );

      if (new Date().getTime() > expireAt) {
        res.status(400).send({ message: "OTP expired" });
      } else if (otp === generatedOTP) {
        res.status(200).send({ message: "Account verified." });
      } else {
        res.status(400).send({ message: "Invalid OTP" });
      }
    } catch (error) {
      next(error);
    }
  }
}
