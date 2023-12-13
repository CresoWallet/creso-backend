import crypto from "crypto";

export const generatedOTP = () =>
  new Promise((res) =>
    crypto.randomBytes(3, (err, buffer) => {
      res(parseInt(buffer.toString("hex"), 16).toString().substr(0, 6));
    })
  );
