"use strict";
// import "reflect-metadata";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { AppDataSource } from "./infrastructure/database/datasource";
const configuration_1 = require("./config/configuration");
const app_1 = __importDefault(require("./app"));
const sequelize_1 = require("./infrastructure/database/sequelize");
async function bootstrap() {
    try {
        // await AppDataSource.initialize();
        await sequelize_1.sequelize.authenticate();
        console.log("PostgreSQL connected successfully");
        app_1.default.listen(configuration_1.configuration.app.port, () => {
            console.log(`Personal Finance API running on http://localhost:${configuration_1.configuration.app.port}`);
        });
    }
    catch (error) {
        console.error("Failed to start application", error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map