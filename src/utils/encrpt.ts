import crypto from "crypto";
import jwt from "jsonwebtoken";
import { generateSalt } from "./wallet";
import { JWT_SECRET } from "../config";
import { ENCRYPTION_KEY } from "../constant";
import { IAuthUser } from "../types";

export interface IEncryptedData {
  [key: string]: any;
  iv: string;
  data: any;
  tag: string;
  salt: string;
}

export function encryptKey(privateKey: string): IEncryptedData {
  const salt = generateSalt();
  const iv = crypto.randomBytes(16); // Initialization vector
  const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32); // Derive key using scrypt
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex"); // Authentication tag for added security

  return {
    iv: iv.toString("hex"),
    data: encrypted,
    tag,
    salt,
  };
}

export function decryptKey(IEncryptedData: IEncryptedData): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, IEncryptedData.salt, 32); // Same key derivation
  const iv = Buffer.from(IEncryptedData.iv, "hex");
  const encryptedText = Buffer.from(IEncryptedData.data, "hex");
  const tag = Buffer.from(IEncryptedData.tag, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function encryptKeyWithPassword(
  privateKey: string,
  password: string
): IEncryptedData {
  const salt = generateSalt();
  const iv = crypto.randomBytes(16); // Initialization vector
  const key = crypto.scryptSync(password, salt, 32); // Derive key using scrypt
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex"); // Authentication tag for added security

  return {
    iv: iv.toString("hex"),
    data: encrypted,
    tag,
    salt,
  };
}

export function encryptDataWithNewPassword(
  data: string,
  password: string
): IEncryptedData {
  const salt = generateSalt();
  const iv = crypto.randomBytes(16); // Initialization vector
  const key = crypto.scryptSync(password, salt, 32); // Derive key using scrypt
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex"); // Authentication tag for added security

  return {
    iv: iv.toString("hex"),
    data: encrypted,
    tag,
    salt,
  };
}

export function decryptDataWithPassword(
  IEncryptedData: IEncryptedData,
  password: string
): string {
  const iv = Buffer.from(IEncryptedData.iv, "hex");
  const key = crypto.scryptSync(password, IEncryptedData.salt, 32);
  const encryptedText = Buffer.from(IEncryptedData.data, "hex");
  const tag = Buffer.from(IEncryptedData.tag, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export const generateJWT = (payload: IAuthUser) => {
  return jwt.sign(
    {
      payload,
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
};
