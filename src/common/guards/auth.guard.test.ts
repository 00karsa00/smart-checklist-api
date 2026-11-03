import { describe, expect, it } from "vitest";

import { signToken } from "../../infrastructure/token";
import { fakeContext } from "../../test/fake-context";
import { authenticate, currentUserId } from "./auth.guard";

const USER_ID = "4b2c77c8-e65b-4232-a395-57bce4f05b86";

describe("authenticate", () => {
  it("sets the user from a valid bearer token", async () => {
    const ctx = fakeContext({ headers: { Authorization: `Bearer ${signToken(USER_ID)}` } });

    await authenticate(ctx);

    expect(currentUserId(ctx)).toBe(USER_ID);
  });

  it.each([
    ["no header", {}, "UNAUTHORIZED", "Authorization token is required."],
    [
      "not bearer",
      { Authorization: "Basic abc" },
      "UNAUTHORIZED",
      "Authorization token is required.",
    ],
    ["garbage token", { Authorization: "Bearer nope" }, "UNAUTHORIZED", "Invalid token."],
  ])("rejects %s", async (_label, headers, code, message) => {
    await expect(async () => authenticate(fakeContext({ headers }))).rejects.toMatchObject({
      statusCode: 401,
      code,
      message,
    });
  });
});

describe("currentUserId", () => {
  it("refuses when no guard set a user", () => {
    expect(() => currentUserId(fakeContext())).toThrow("Authorization token is required.");
  });
});
