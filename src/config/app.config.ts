export const appConfig = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3001,
  apiPrefix: process.env.API_PREFIX || "/api",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
};