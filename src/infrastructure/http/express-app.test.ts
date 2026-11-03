import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppError } from "../../common/errors/app.error";
import { createHttpApp, Guard, HttpServer } from ".";

const requireKey: Guard = (ctx) => {
  if (ctx.header("x-key") !== "yes") throw new AppError(401, "UNAUTHORIZED", "No key.");
};

const rejectBadId: Guard = (ctx) => {
  if (ctx.params.id === "bad") throw new AppError(400, "VALIDATION_ERROR", "Bad id.");
};

let server: HttpServer;
let base: string;

beforeAll(async () => {
  const app = createHttpApp({
    apiPrefix: "/api",
    corsOrigin: "http://localhost:3000",
    modules: [
      {
        path: "/things",
        guards: [requireKey],
        routes: [
          { method: "get", path: "/fixed", handler: async () => "fixed" },
          {
            method: "get",
            path: "/:id",
            guards: [rejectBadId],
            handler: async (ctx) => ({ id: ctx.params.id, q: ctx.query.q }),
          },
          {
            method: "post",
            path: "/",
            status: 201,
            handler: async (ctx) => ctx.body,
          },
          {
            method: "delete",
            path: "/:id",
            handler: async () => {
              throw new Error("boom");
            },
          },
        ],
      },
    ],
  });
  server = await app.listen(0);
  base = `http://localhost:${server.port}/api`;
});

afterAll(() => server.close());

const withKey = { "x-key": "yes" };

describe("createHttpApp", () => {
  it("wraps handler data in the success envelope with the request id", async () => {
    const res = await fetch(`${base}/things/7?q=hi`, {
      headers: { ...withKey, "x-request-id": "rid-1" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBe("rid-1");
    expect(await res.json()).toEqual({
      success: true,
      data: { id: "7", q: "hi" },
      meta: null,
      requestId: "rid-1",
    });
  });

  it("generates a request id when the client sends none", async () => {
    const res = await fetch(`${base}/things/7`, { headers: withKey });
    const body = await res.json();

    expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.headers.get("x-request-id")).toBe(body.requestId);
  });

  it("uses the route status and passes the JSON body through", async () => {
    const res = await fetch(`${base}/things`, {
      method: "POST",
      headers: { ...withKey, "content-type": "application/json" },
      body: JSON.stringify({ name: "a" }),
    });

    expect(res.status).toBe(201);
    expect((await res.json()).data).toEqual({ name: "a" });
  });

  it("matches routes in the order they are declared", async () => {
    const res = await fetch(`${base}/things/fixed`, { headers: withKey });
    expect((await res.json()).data).toBe("fixed");
  });

  it("turns AppError from a route guard into the error envelope", async () => {
    const res = await fetch(`${base}/things/bad`, {
      headers: { ...withKey, "x-request-id": "rid-2" },
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Bad id." },
      requestId: "rid-2",
    });
  });

  it("runs module guards for every path under the module, even unknown ones", async () => {
    const known = await fetch(`${base}/things/7`);
    const unknown = await fetch(`${base}/things/a/b/c`);

    expect(known.status).toBe(401);
    expect(unknown.status).toBe(401);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await fetch(`${base}/nothing-here`);

    expect(res.status).toBe(404);
    expect((await res.json()).error).toEqual({
      code: "NOT_FOUND",
      message: "Route GET /api/nothing-here not found",
    });
  });

  it("hides unexpected errors behind a generic 500", async () => {
    const res = await fetch(`${base}/things/7`, { method: "DELETE", headers: withKey });

    expect(res.status).toBe(500);
    expect((await res.json()).error).toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    });
  });
});
