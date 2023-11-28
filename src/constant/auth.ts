import { SERVER_URL } from "../config";

export const TWITTER_CONSUMER_KEY = process.env.CLIENT_ID || '';
export const TWITTER_CONSUMER_SECRET = process.env.CLIENT_SECRET || '';



export const TWITTER_CALLBACK = SERVER_URL + "/api/auth/twitter/callback"



export const AUTH_TOKEN = "auth_token"