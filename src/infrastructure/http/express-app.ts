import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import express, { NextFunction, Request, RequestHandler, Response } from "express";
import cors from "cors";

import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { errorResponse, successResponse } from "../../common/responses/api-response";
import { logger } from "../logger";
import { ApiModule, FileResponse, Guard, HttpApp, HttpContext, Route } from "./types";

export type HttpAppOptions = {
  apiPrefix: string;
  corsOrigin: string;
  modules: ApiModule[];
};

/** Build the web app from module definitions. The only file that knows Express. */
export function createHttpApp({ apiPrefix, corsOrigin, modules }: HttpAppOptions): HttpApp {
  const app = express();

  app.disable("x-powered-by");
  // One origin, or several separated by commas (e.g. the app and its test build).
  const origins = corsOrigin.split(",").map((origin) => origin.trim());
  app.use(cors({ origin: origins.length === 1 ? origins[0] : origins, credentials: true }));
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
    const bodyParsers = route.rawBody
      ? [express.raw({ type: [...route.rawBody.types], limit: route.rawBody.maxBytes })]
      : [];
    router[route.method](
      route.path,
      ...bodyParsers,
      ...(route.guards ?? []).map(runGuard),
      runHandler(route),
    );
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
    // IPv4 callers can arrive as "::ffff:1.2.3.4"; keep the plain IPv4 form for logs.
    ip: (req.ip ?? "").replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/, ""),
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
      if (data instanceof FileResponse) {
        sendFile(res, data);
        return;
      }
      res.status(route.status ?? 200).json(successResponse(data, ctx.requestId));
    } catch (error) {
      next(error);
    }
  };
}

function sendFile(res: Response, file: FileResponse): void {
  // RFC 6266: an ASCII fallback plus the exact UTF-8 name.
  const asciiName = file.fileName.replace(/[^\x20-\x7e]|["\\]/g, "_");
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Length", String(file.data.length));
  res.setHeader(
    "Content-Disposition",
    `${file.disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
  );
  // The declared type is the only one the browser may use.
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).end(file.data);
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

  // Body parser failures: malformed JSON or a body over the size limit.
  const parserError = bodyParserError(error);
  if (parserError) {
    logger.error(parserError.message, { requestId, code: parserError.code });
    res
      .status(parserError.statusCode)
      .json(errorResponse(parserError.code, parserError.message, requestId));
    return;
  }

  logger.error("Unhandled application error", { requestId, error });
  res
    .status(500)
    .json(errorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR, "Internal server error", requestId));
}

function bodyParserError(error: unknown): AppError | null {
  const type = (error as { type?: unknown } | null)?.type;
  if (type === "entity.too.large") {
    return new AppError(413, ERROR_CODES.PAYLOAD_TOO_LARGE, "The request body is too large.");
  }
  if (type === "entity.parse.failed") {
    return new AppError(400, ERROR_CODES.BAD_REQUEST, "The request body is not valid JSON.");
  }
  return null;
}
