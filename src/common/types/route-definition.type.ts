import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";

/** Supported HTTP methods for a declarative route definition. */
export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/**
 * A loosely-typed request handler slot.
 *
 * Controllers in this codebase declare narrow `Request<Params, ResBody, ...>`
 * generics for type safety (some even use `never` for the body). Those don't
 * structurally satisfy Express's default `RequestHandler`, so we accept any
 * handler shape here — mirroring the permissiveness of Express's own
 * `router[method](...)` overloads. Type safety still lives in each controller.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRequestHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Request<any, any, any, any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: Response<any, any>,
  next: NextFunction,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any;

/**
 * A single, declarative route definition.
 *
 * Instead of chaining `router.get(path, mw1, mw2, handler)` for every endpoint,
 * a module describes its routes as plain data and lets {@link registerRoutes}
 * wire them onto an Express router.
 */
export interface RouteDefinition {
  /** HTTP method for the route. */
  method: HttpMethod;
  /** Path relative to the router mount point (e.g. "/", "/:id"). */
  path: string;
  /**
   * Validation / auth / any other middlewares to run before the handler.
   * Order is preserved. Optional — omit for routes with no middleware.
   */
  middlewares?: AnyRequestHandler[];
  /** Final request handler (controller) for the route. */
  handler: AnyRequestHandler;
}

/**
 * Iterates a list of {@link RouteDefinition}s and registers each one on the
 * given router, applying its middlewares in order before the handler.
 */
export function registerRoutes(
  router: Router,
  routes: RouteDefinition[],
): Router {
  for (const { method, path, middlewares = [], handler } of routes) {
    const chain = [...middlewares, handler] as RequestHandler[];
    router[method](path, ...chain);
  }

  return router;
}
