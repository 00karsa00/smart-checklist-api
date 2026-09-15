import dotenv from "dotenv";

dotenv.config();

export const configuration = {
  app: {
    env: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 3001,
    apiPrefix: process.env.API_PREFIX || "/api",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },

  database: {
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME || "postgres",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "personal_finance",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "change-me-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
};