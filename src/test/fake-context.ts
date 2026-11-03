import { HttpContext } from "../infrastructure/http";

/** A request context for testing guards and controllers without a server. */
export function fakeContext(
  input: {
    params?: Record<string, string>;
    query?: Record<string, string | undefined>;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): HttpContext {
  const headers = Object.fromEntries(
    Object.entries(input.headers ?? {}).map(([name, value]) => [name.toLowerCase(), value]),
  );

  return {
    params: input.params ?? {},
    query: input.query ?? {},
    body: input.body as Record<string, unknown>,
    requestId: "test-request",
    header: (name) => headers[name.toLowerCase()],
  };
}
