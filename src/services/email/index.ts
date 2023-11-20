import nodemailer from "nodemailer";

import { EMAIL_ACCESS_PASSWORD, USER_EMAIL } from "../../constant";

export const getTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: USER_EMAIL,
      pass: EMAIL_ACCESS_PASSWORD,
    },
  });

export const getMailOptions = ({ to, subject, text }: any) => {
  return {
    from: process.env.SENDER,
    to,
    subject,
    text,
  };
};
