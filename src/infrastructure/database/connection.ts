import { Sequelize } from "sequelize-typescript";

import { databaseConfig } from "../../config/database.config";
import { User } from "./models/user.model";
import { Account } from "./models/accounts.model";
import { TransactionType } from "./models/transaction-types.model";
import { AllTransaction } from "./models/all-transactions.model";
import { PaymentMethod } from "./models/payment-methods.model";
import { Source } from "./models/sources.model";
import { Category } from "./models/categories.model";
import { Subcategory } from "./models/subcategories.model";
import { Person } from "./models/people.model";
import { BorrowLendType } from "./models/borrow-lend-types.model";
import { BorrowLend } from "./models/borrow-lend.model";

// Add a model here when you create a new table.
const MODELS = [
  User,
  Account,
  TransactionType,
  AllTransaction,
  PaymentMethod,
  Source,
  Category,
  Subcategory,
  Person,
  BorrowLendType,
  BorrowLend,
];

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
