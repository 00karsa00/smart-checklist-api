import express from "express";
import cors from "cors";

import { configuration } from "./config/configuration";
import { requestIdMiddleware } from "./common/middleware/request-id.middleware";
import { loggingMiddleware } from "./common/middleware/logging.middleware";
import { errorMiddleware } from "./common/middleware/error.middleware";
import { AppError } from "./common/errors/app.error";
import { ERROR_CODES } from "./common/errors/error.codes";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import accountRoutes from "./modules/account/account.routes";
import transactionRoutes from "./modules/transaction/transaction.routes";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: configuration.app.corsOrigin,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(requestIdMiddleware);
app.use(loggingMiddleware);

app.get(`${configuration.app.apiPrefix}/health`, (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "personal-finance-backend",
      timestamp: new Date().toISOString(),
    },
  });
});

app.use(
  `${configuration.app.apiPrefix}/auth`,
  authRoutes,
);

app.use(
  `${configuration.app.apiPrefix}/users`,
  userRoutes,
);

app.use(
  `${configuration.app.apiPrefix}/accounts`,
  accountRoutes,
);

app.use(
  `${configuration.app.apiPrefix}/transactions`,
  transactionRoutes,
);

// 404 handler
app.use((req, _res, next) => {
  next(
    new AppError(
      404,
      ERROR_CODES.NOT_FOUND,
      `Route ${req.method} ${req.originalUrl} not found`,
    ),
  );
});

app.use(errorMiddleware);

export default app;
