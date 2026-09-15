import { Sequelize } from "sequelize-typescript";

import { configuration } from "../../config/configuration";
import { User } from "./models/user.model";
import { Account } from "./models/accounts.model";
import { TransactionType } from "./models/transaction-types.model";
import { AllTransaction } from "./models/all-transactions.model";

export const sequelize = new Sequelize(
  configuration.database.database,
  configuration.database.username,
  configuration.database.password,
  {
    host: configuration.database.host,
    port: configuration.database.port,
    dialect: "postgres",

    logging: false,

    models: [User, Account, TransactionType, AllTransaction],

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);
