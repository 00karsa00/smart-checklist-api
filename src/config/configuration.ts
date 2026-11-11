import { readBooleanEnv, readEnv, readNumberEnv, requireEnv } from "../infrastructure/env";
import { databaseConfig } from "./database.config";

const env = readEnv("NODE_ENV", "development");

// Every setting the app uses, in one typed object. Add new settings here and
// document them in .env.example.
export const configuration = {
  app: {
    name: readEnv("APP_NAME", "api"),
    /** Shown on the admin system page; npm sets it from package.json when started with npm. */
    version: readEnv("APP_VERSION", readEnv("npm_package_version", "unknown")),
    env,
    isProduction: env === "production",
    port: readNumberEnv("PORT", 3001),
    apiPrefix: readEnv("API_PREFIX", "/api"),
    corsOrigin: readEnv("CORS_ORIGIN", "http://localhost:3000"),
  },

  database: databaseConfig,

  storage: {
    /** Where uploaded files are kept (relative to the working directory, or absolute). */
    uploadDir: readEnv("UPLOAD_DIR", "storage/uploads"),
  },

  /** Settings a user starts with until they change them (GET/PATCH /profile/user/settings). */
  userDefaults: {
    currency: readEnv("DEFAULT_CURRENCY", "INR"),
    locale: readEnv("DEFAULT_LOCALE", "en-IN"),
    timeZone: readEnv("DEFAULT_TIME_ZONE", "Asia/Kolkata"),
    /** 0 = Sunday … 6 = Saturday. */
    weekStartsOn: readNumberEnv("DEFAULT_WEEK_STARTS_ON", 1),
  },

  auth: {
    /** Whether app users may create their own account (POST /auth/user/register). */
    allowRegistration: readBooleanEnv("AUTH_ALLOW_REGISTRATION", true),
    /**
     * Attempts allowed per 15 minutes before 429 Too Many Requests: failed
     * sign-ins per caller (IP) and account, sign-in per IP, and register per IP. 0 turns a limit off. The
     * per-IP limits are off by default outside production, where every request
     * comes from localhost (development, browser tests).
     */
    rateLimit: {
      windowMinutes: 15,
      signInPerAccount: readNumberEnv("AUTH_SIGN_IN_LIMIT", 10),
      signInPerIp: readNumberEnv("AUTH_SIGN_IN_IP_LIMIT", env === "production" ? 100 : 0),
      registerPerIp: readNumberEnv("AUTH_REGISTER_LIMIT", env === "production" ? 20 : 0),
    },
  },

  jwt: {
    secret: requireEnv("JWT_SECRET"),
    /** Access token lifetime. Short, because a refresh token renews it. */
    expiresIn: readEnv("JWT_EXPIRES_IN", "15m"),
    /** How long a session (its refresh token) lasts without being used. */
    refreshTokenDays: readNumberEnv("REFRESH_TOKEN_DAYS", 30),
  },
};

export type Configuration = typeof configuration;
