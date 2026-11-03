import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import express, { NextFunction, Request, RequestHandler, Response } from "express";
import cors from "cors";

import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { errorResponse, successResponse } from "../../common/responses/api-response";
import { logger } from "../logger";
import { ApiModule, Guard, HttpApp, HttpContext, Route } from "./types";

export interface HttpAppOptions {
  apiPrefix: string;
  corsOrigin: string;
  modules: ApiModule[];
}

/** Build the web app from module definitions. The only file that knows Express. */
export function createHttpApp({ apiPrefix, corsOrigin, modules }: HttpAppOptions): HttpApp {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(assignRequestId);
  app.use(logRequest);

  for (const module of modules) {
    app.use(`${apiPrefix}${module.path}`, buildRouter(module));
  }

  app.use((req, _res, next) => {
    next(
      new AppError(404, ERROR_CODES.NOT_FOUND, `Route ${req.method} ${req.originalUrl} not found`),
    );
  });
  app.use(handleError);

  return {
    listen(port) {
      return new Promise((resolve, reject) => {
        const server = app.listen(port, (error?: Error) => {
          if (error) return reject(error);
          resolve({
            port: (server.address() as AddressInfo).port,
            close: () => new Promise((done) => server.close(() => done())),
          });
        });
      });
    },
  };
}

function buildRouter(module: ApiModule): express.Router {
  const router = express.Router();

  for (const guard of module.guards ?? []) {
    router.use(runGuard(guard));
  }

  for (const route of module.routes) {
    router[route.method](route.path, ...(route.guards ?? []).map(runGuard), runHandler(route));
  }

  return router;
}

// ── Adapters between Express and our framework-free contracts ────────────────

function contextOf(req: Request, res: Response): HttpContext {
  if (res.locals.ctx) return res.locals.ctx as HttpContext;

  // Getters, because Express replaces req.params at each routing layer.
  const ctx: HttpContext = {
    get params() {
      return req.params as Record<string, string>;
    },
    get query() {
      return req.query as Record<string, string | undefined>;
    },
    get body() {
      return req.body;
    },
    set body(value) {
      req.body = value;
    },
    requestId: String(req.headers["x-request-id"]),
    header: (name) => req.get(name),
  };

  res.locals.ctx = ctx;
  return ctx;
}

function runGuard(guard: Guard): RequestHandler {
  return async (req, res, next) => {
    try {
      await guard(contextOf(req, res));
      next();
    } catch (error) {
      next(error);
    }
  };
}

function runHandler(route: Route): RequestHandler {
  return async (req, res, next) => {
    try {
      const ctx = contextOf(req, res);
      const data = await route.handler(ctx);
      res.status(route.status ?? 200).json(successResponse(data, ctx.requestId));
    } catch (error) {
      next(error);
    }
  };
}

// ── Cross-cutting middleware ─────────────────────────────────────────────────

function assignRequestId(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

function logRequest(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on("finish", () => {
    logger.info("HTTP Request", {
      requestId: req.headers["x-request-id"],
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startTime,
    });
  });

  next();
}

function handleError(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.headers["x-request-id"] as string;

  if (error instanceof AppError) {
    logger.error(error.message, { requestId, code: error.code, statusCode: error.statusCode });
    res.status(error.statusCode).json(errorResponse(error.code, error.message, requestId));
    return;
  }

  logger.error("Unhandled application error", { requestId, error });
  res
    .status(500)
    .json(errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR, "Internal server error", requestId));
}
