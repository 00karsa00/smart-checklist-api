"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
module.exports = {
    development: {
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        dialect: "postgres",
    },
    test: {
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: `${process.env.DATABASE_NAME}_test`,
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        dialect: "postgres",
    },
    production: {
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        dialect: "postgres",
    },
};
//# sourceMappingURL=database.config.js.map