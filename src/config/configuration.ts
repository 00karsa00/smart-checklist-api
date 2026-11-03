import {
  readBooleanEnv,
  readEnv,
  readNumberEnv,
  requireEnv,
} from "../infrastructure/env";
import { databaseConfig } from "./database.config";

const env = readEnv("NODE_ENV", "development");

// Every setting the app uses, in one typed object. Add new settings here and
// document them in .env.example.
export const configuration = {
  app: {
    env,
    isProduction: env === "production",
    port: readNumberEnv("PORT", 3001),
    apiPrefix: readEnv("API_PREFIX", "/api"),
    corsOrigin: readEnv("CORS_ORIGIN", "http://localhost:3000"),
  },

  database: databaseConfig,

  jwt: {
    secret: requireEnv("JWT_SECRET"),
    expiresIn: readEnv("JWT_EXPIRES_IN", "7d"),
  },

  auth: {
    // POST /auth/token mints a token for any user id without a password. Handy
    // for local testing; never expose it in production.
    allowDevTokens: readBooleanEnv("AUTH_ALLOW_DEV_TOKENS", env !== "production"),
  },
};

export type Configuration = typeof configuration;
