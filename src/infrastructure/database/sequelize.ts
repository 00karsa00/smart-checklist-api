import { Sequelize } from "sequelize-typescript";

import { configuration } from "../../config/configuration";
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

export const sequelize = new Sequelize(
  configuration.database.database,
  configuration.database.username,
  configuration.database.password,
  {
    host: configuration.database.host,
    port: configuration.database.port,
    dialect: "postgres",

    logging: false,

    models: [
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
    ],

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);
