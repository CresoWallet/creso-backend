import otpGenerator from "otp-generator";

export const generatedOTP = otpGenerator.generate(6, {
  upperCaseAlphabets: false,
  specialChars: false,
  lowerCaseAlphabets: false,
});
