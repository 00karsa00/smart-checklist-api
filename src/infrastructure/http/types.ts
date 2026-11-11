import { AuthenticatedUser } from "../../common/types/authenticated-user.type";

// Framework-free HTTP contracts. Modules only see these types, never the web
// framework, so swapping the framework only touches ./express-app.ts.

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/** Route params, query or body for endpoints that take none. */
export type NoParams = Record<string, never>;

/** Route params for `/:id` paths. */
export type IdParams = {
  id: string;
  [key: string]: string;
};

/** Everything a guard or handler may read from (or attach to) a request. */
export type HttpContext<
  Params = Record<string, string>,
  Query = Record<string, string | undefined>,
  Body = Record<string, unknown>,
> = {
  readonly params: Params;
  readonly query: Query;
  /** Parsed JSON body. Guards may normalise fields in place. */
  body: Body;
  readonly requestId: string;
  /** Caller's IP address (behind a proxy, enable the framework's trust-proxy setting). */
  readonly ip: string;
  /** Set by the authenticate guard. */
  user?: AuthenticatedUser;
  header(name: string): string | undefined;
};

// `any` keeps handlers with narrow context types assignable to the shared slot.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyHttpContext = HttpContext<any, any, any>;

/** Runs before the handler. Throw an AppError to stop the request. */
export type Guard = (ctx: AnyHttpContext) => void | Promise<void>;

/**
 * A file sent as-is instead of the JSON envelope. Create it with
 * `fileResponse(...)` and return it from a handler (e.g. a download).
 */
export class FileResponse {
  constructor(
    readonly data: Buffer,
    readonly contentType: string,
    readonly fileName: string,
    /** "inline" shows it in the browser (images, PDF); "attachment" downloads it. */
    readonly disposition: "inline" | "attachment" = "inline",
  ) {}
}

export function fileResponse(
  data: Buffer,
  contentType: string,
  fileName: string,
  disposition: "inline" | "attachment" = "inline",
): FileResponse {
  return new FileResponse(data, contentType, fileName, disposition);
}

/** Returns the `data` part of the response; the envelope is added for you. */
export type Handler = (ctx: AnyHttpContext) => Promise<unknown>;

export type Route = {
  method: HttpMethod;
  /** Relative to the module path, e.g. "/" or "/:id". */
  path: string;
  /** Validation and other checks, run in order after the module guards. */
  guards?: Guard[];
  /** Success status code. Defaults to 200. */
  status?: number;
  /**
   * Accept the request body as raw bytes (a file upload) instead of JSON:
   * `ctx.body` is then a Buffer when the Content-Type is one of `types`.
   * Bodies over `maxBytes` are refused with 413.
   */
  rawBody?: { types: readonly string[]; maxBytes: number };
  handler: Handler;
};

/** A feature's routes, mounted under `${apiPrefix}${path}`. */
export type ApiModule = {
  path: string;
  /** Run for every request under `path`, including unknown sub-paths. */
  guards?: Guard[];
  /** Matched in order: put fixed paths ("/active") before params ("/:id"). */
  routes: Route[];
};

export type HttpServer = {
  port: number;
  close(): Promise<void>;
};

export type HttpApp = {
  listen(port: number): Promise<HttpServer>;
};
