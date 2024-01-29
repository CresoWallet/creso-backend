import nodemailer from "nodemailer";
import {
  EMAIL_ACCESS_PASSWORD,
  MAILCHIMP_API_KEY,
  USER_EMAIL,
} from "../../constant";
import AppError from "../../errors/app";

const mailchimp = require("@mailchimp/mailchimp_transactional")(
  MAILCHIMP_API_KEY
);

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

interface IMessage {
  receivers: (string | null)[];
  template_name: string;
  otp?: string;
  receiverName?: string;
  guardian?: string;
  walletAddress?: string;
  platform?: string;
  devices?: any;
}

const getMessage = async (messagePayload: IMessage) => {
  const {
    receivers,
    template_name,
    otp,
    receiverName,
    guardian,
    walletAddress,
    devices,
    platform,
  } = messagePayload;
  const receiversArray = [] as any;
  receivers.map((email: any) => {
    receiversArray.push({ email, type: "to" });
  });

  var message = {};

  if (template_name === "otp-email") {
    message = {
      subject: "OTP verification",
      text: `Here is the verification code. Please copy it and verify your Email ${otp}`,
      to: receiversArray,
      global_merge_vars: [
        {
          name: "OTP",
          content: otp,
        },
      ],
    };
  } else if (template_name === "add-guardian") {
    message = {
      subject: "Adding you as a guardian",
      text: `The ${guardian} wallet address has been added to the list of guardians for the ${walletAddress} address.`,
      to: receiversArray,
      global_merge_vars: [
        {
          name: "guardian",
          content: guardian,
        },
        {
          name: "name",
          content: receiverName,
        },
        {
          name: "walletAddress",
          content: walletAddress,
        },
      ],
    };
  } else if (template_name === "start-recovery") {
    message = {
      subject: "Recovery commenced",
      text: `The recovery of the ${walletAddress} wallet address is currently underway.  You are one of the wallet's guardians. reclaim this account within the next 24 hours.`,
      to: receiversArray,
      global_merge_vars: [
        {
          name: "walletAddress",
          content: walletAddress,
        },
      ],
    };
  } else if (template_name === "push-notification") {
    message = {
      subject: "Registered devices for push notification",
      text: `${devices}`,
      to: receiversArray,
      global_merge_vars: [
        {
          name: "devices",
          content: devices,
        },
      ],
    };
  } else if (template_name === "request-transaction-approval") {
    message = {
      subject: "Requesting approval for transaction",
      text: `Requesting approval for transaction. please accept the invitation on main device ${platform}`,
      to: receiversArray,
      global_merge_vars: [
        {
          name: "devices",
          content: platform,
        },
      ],
    };
  }
  return message;
};

export const sendEmail = async (messagePayload: IMessage) => {
  const message = await getMessage(messagePayload);
  const { template_name } = messagePayload;

  try {
    const response = await mailchimp.messages.sendTemplate({
      template_name,
      template_content: [{}],
      message,
    });

    if (response && response.length > 0) {
      return response;
    } else {
      throw new AppError("Error sending email", 404);
    }
  } catch (error) {
    throw new AppError("Error sending email", 404);
  }
};
