"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const configuration_1 = require("../../config/configuration");
exports.sequelize = new sequelize_1.Sequelize(configuration_1.configuration.database.database, configuration_1.configuration.database.username, configuration_1.configuration.database.password, {
    host: configuration_1.configuration.database.host,
    port: configuration_1.configuration.database.port,
    dialect: "postgres",
    logging: false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
//# sourceMappingURL=sequelize.js.map