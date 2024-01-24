import crypto from "crypto";
import { prisma } from "../services/prisma";
import { sendEmail } from "../services/email";

interface ISendOtp {
  email: string;
}

export const generatedOTP = () =>
  new Promise((res) =>
    crypto.randomBytes(3, (err, buffer) => {
      res(parseInt(buffer.toString("hex"), 16).toString().substr(0, 6));
    })
  );

export const sendOtp = async ({ email }: ISendOtp) => {
  try {
    const otp: any = await generatedOTP();

    await prisma.verification.upsert({
      where: {
        email: email,
      },
      update: {
        otp: +otp,
        expireAt: new Date(new Date().getTime() + 5 * 60000),
      },
      create: {
        email,
        otp: +otp,
        expireAt: new Date(new Date().getTime() + 5 * 60000),
      },
    });

    const emailResponse = await sendEmail({
      receivers: [email],
      template_name: "otp-email",
      otp,
    });
    if (emailResponse) {
      return emailResponse;
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
