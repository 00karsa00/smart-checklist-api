import { ModelCtor, Sequelize } from "sequelize-typescript";

import { databaseConfig } from "../../config/database.config";

// Register every model here when you create a table, e.g.
//   import { Item } from "./models/item.model";
//   const MODELS = [Item];
const MODELS: ModelCtor[] = [];

const sequelize = new Sequelize(
  databaseConfig.database,
  databaseConfig.username,
  databaseConfig.password,
  {
    host: databaseConfig.host,
    port: databaseConfig.port,
    dialect: "postgres",
    logging: databaseConfig.logging ? console.log : false,
    models: MODELS,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

/** Open the connection pool and verify the database is reachable. */
export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
}

export async function disconnectDatabase(): Promise<void> {
  await sequelize.close();
}
