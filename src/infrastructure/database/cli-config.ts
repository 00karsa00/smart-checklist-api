import { databaseConfig } from "../../config/database.config";

// Settings for sequelize-cli (migrations and seeders), loaded through .sequelizerc
// from the compiled dist/ copy. Reuses the app's database settings.
const connection = {
  username: databaseConfig.username,
  password: databaseConfig.password,
  database: databaseConfig.database,
  host: databaseConfig.host,
  port: databaseConfig.port,
  dialect: "postgres" as const,
};

export = {
  development: connection,
  test: { ...connection, database: `${databaseConfig.database}_test` },
  production: connection,
};
