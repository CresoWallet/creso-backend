import { SERVER_URL } from "../config";

export const TWITTER_CONSUMER_KEY = process.env.TWITTER_CLIENT_ID || "";
export const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CLIENT_SECRET || "";

export const GOOGLE_CONSUMER_KEY = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CONSUMER_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export const TWITTER_CALLBACK = SERVER_URL + "/api/auth/twitter/callback";
// export const TWITTER_CALLBACK =
//   "http://localhost:8080/api/auth/twitter/callback";

// export const GOOGLE_CALLBACK = "http://localhost:8080/api/auth/google/callback";
export const GOOGLE_CALLBACK = SERVER_URL + "/api/auth/google/callback";

export const AUTH_TOKEN = "auth_token";
