import { AuthenticatedUser } from "../../common/types/authenticated-user.type";

// Framework-free HTTP contracts. Modules only see these types, never the web
// framework, so swapping the framework only touches ./express-app.ts.

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/** Route params, query or body for endpoints that take none. */
export type NoParams = Record<string, never>;

/** Route params for `/:id` paths. */
export interface IdParams {
  id: string;
  [key: string]: string;
}

/** Everything a guard or handler may read from (or attach to) a request. */
export interface HttpContext<
  Params = Record<string, string>,
  Query = Record<string, string | undefined>,
  Body = Record<string, unknown>,
> {
  readonly params: Params;
  readonly query: Query;
  /** Parsed JSON body. Guards may normalise fields in place. */
  body: Body;
  readonly requestId: string;
  /** Set by the authenticate guard. */
  user?: AuthenticatedUser;
  header(name: string): string | undefined;
}

// `any` keeps handlers with narrow context types assignable to the shared slot.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyHttpContext = HttpContext<any, any, any>;

/** Runs before the handler. Throw an AppError to stop the request. */
export type Guard = (ctx: AnyHttpContext) => void | Promise<void>;

/** Returns the `data` part of the response; the envelope is added for you. */
export type Handler = (ctx: AnyHttpContext) => Promise<unknown>;

export interface Route {
  method: HttpMethod;
  /** Relative to the module path, e.g. "/" or "/:id". */
  path: string;
  /** Validation and other checks, run in order after the module guards. */
  guards?: Guard[];
  /** Success status code. Defaults to 200. */
  status?: number;
  handler: Handler;
}

/** A feature's routes, mounted under `${apiPrefix}${path}`. */
export interface ApiModule {
  path: string;
  /** Run for every request under `path`, including unknown sub-paths. */
  guards?: Guard[];
  /** Matched in order: put fixed paths ("/active") before params ("/:id"). */
  routes: Route[];
}

export interface HttpServer {
  port: number;
  close(): Promise<void>;
}

export interface HttpApp {
  listen(port: number): Promise<HttpServer>;
}
