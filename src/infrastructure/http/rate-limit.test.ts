import { describe, expect, it } from "vitest";

import { AppError } from "../../common/errors/app.error";
import { failureLimit, RateCounter, rateLimit } from "./rate-limit";
import { AnyHttpContext } from "./types";

const ctx = (ip: string) => ({ ip }) as AnyHttpContext;

describe("rateLimit", () => {
  it("allows max per key, then refuses with 429 until the window ends", () => {
    let now = 0;
    const counter = new RateCounter(60_000, () => now);
    const guard = rateLimit({ name: "t", max: 2, windowMinutes: 1, counter, key: (c) => c.ip });
    guard(ctx("a"));
    guard(ctx("a"));
    expect(() => guard(ctx("a"))).toThrow(AppError);
    try {
      guard(ctx("a"));
    } catch (error) {
      expect((error as AppError).statusCode).toBe(429);
    }
    // Another caller has its own count.
    expect(() => guard(ctx("b"))).not.toThrow();
    // A new window starts afresh.
    now = 60_000;
    expect(() => guard(ctx("a"))).not.toThrow();
  });

  it("does nothing with max 0 or no key", () => {
    const off = rateLimit({ name: "o", max: 0, windowMinutes: 1, key: () => "x" });
    const skip = rateLimit({ name: "s", max: 1, windowMinutes: 1, key: () => null });
    for (let i = 0; i < 5; i++) {
      off(ctx("a"));
      skip(ctx("a"));
    }
  });
});

describe("failureLimit", () => {
  const refused = () => Promise.reject(new AppError(401, "INVALID_CREDENTIALS", "Wrong password."));
  const accepted = () => Promise.resolve("ok");

  it("counts only failures, then refuses with 429", async () => {
    const limit = failureLimit({ name: "f", max: 2, windowMinutes: 1, key: (c) => c.ip });
    const signIn = (handler: () => Promise<unknown>) => {
      limit.guard(ctx("a"));
      return limit.counting(handler)(ctx("a"));
    };
    for (let i = 0; i < 5; i++) await expect(signIn(accepted)).resolves.toBe("ok");
    await expect(signIn(refused)).rejects.toMatchObject({ statusCode: 401 });
    await expect(signIn(refused)).rejects.toMatchObject({ statusCode: 401 });
    // Two failures: the next attempt is refused before it runs, even with the right password.
    expect(() => limit.guard(ctx("a"))).toThrow(AppError);
    expect(() => limit.guard(ctx("b"))).not.toThrow();
  });

  it("ignores other errors and lets a new window start afresh", async () => {
    let now = 0;
    const counter = new RateCounter(60_000, () => now);
    const limit = failureLimit({ name: "g", max: 1, windowMinutes: 1, key: (c) => c.ip, counter });
    const broken = () => Promise.reject(new AppError(500, "INTERNAL_SERVER_ERROR", "Oops."));
    await expect(limit.counting(broken)(ctx("a"))).rejects.toBeTruthy();
    expect(() => limit.guard(ctx("a"))).not.toThrow();
    await expect(limit.counting(refused)(ctx("a"))).rejects.toBeTruthy();
    expect(() => limit.guard(ctx("a"))).toThrow(AppError);
    now = 60_000;
    expect(() => limit.guard(ctx("a"))).not.toThrow();
  });
});
