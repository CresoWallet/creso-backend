import { CorsOptions } from "cors";

export const NODE_ENV = process.env.NODE_ENV || "development";

export const IN_PROD = NODE_ENV === "production";

export const CLIENT_URL = process.env.CLIENT_URL;

export const SERVER_URL = process.env.SERVER_URL;

// const allowedOrigins = "*";

const allowedOrigins = [
  "http://localhost:3000",
  "https://creso-wallet.vercel.app",
  "https://wallet-x-beta.vercel.app",
  "https://app.creso.io",
  "localhost/127.0.0.1:8080",
];
export const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
};
