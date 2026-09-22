"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const configuration_1 = require("../../config/configuration");
const user_model_1 = require("./models/user.model");
const accounts_model_1 = require("./models/accounts.model");
const transaction_types_model_1 = require("./models/transaction-types.model");
const all_transactions_model_1 = require("./models/all-transactions.model");
exports.sequelize = new sequelize_typescript_1.Sequelize(configuration_1.configuration.database.database, configuration_1.configuration.database.username, configuration_1.configuration.database.password, {
    host: configuration_1.configuration.database.host,
    port: configuration_1.configuration.database.port,
    dialect: "postgres",
    logging: false,
    models: [user_model_1.User, accounts_model_1.Account, transaction_types_model_1.TransactionType, all_transactions_model_1.AllTransaction],
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
//# sourceMappingURL=sequelize.js.map