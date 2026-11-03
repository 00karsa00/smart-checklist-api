import { readBooleanEnv, readEnv, readNumberEnv } from "../infrastructure/env";

// Kept separate from configuration.ts so the migration CLI can load it without
// needing app secrets such as JWT_SECRET.
export const databaseConfig = {
  host: readEnv("DATABASE_HOST", "localhost"),
  port: readNumberEnv("DATABASE_PORT", 5432),
  username: readEnv("DATABASE_USERNAME", "postgres"),
  password: readEnv("DATABASE_PASSWORD", ""),
  database: readEnv("DATABASE_NAME", "personal_finance"),
  logging: readBooleanEnv("DATABASE_LOGGING", false),
};

export type DatabaseConfig = typeof databaseConfig;
