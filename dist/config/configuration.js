"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuration = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.configuration = {
    app: {
        env: process.env.NODE_ENV || "development",
        port: Number(process.env.PORT) || 3001,
        apiPrefix: process.env.API_PREFIX || "/api",
        corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
    },
    database: {
        host: process.env.DATABASE_HOST || "localhost",
        port: Number(process.env.DATABASE_PORT) || 5432,
        username: process.env.DATABASE_USERNAME || "postgres",
        password: process.env.DATABASE_PASSWORD || "",
        database: process.env.DATABASE_NAME || "personal_finance",
    },
    jwt: {
        secret: process.env.JWT_SECRET || "change-me-in-production",
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
};
//# sourceMappingURL=configuration.js.map