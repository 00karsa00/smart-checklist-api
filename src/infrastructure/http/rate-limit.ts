import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";

import { AnyHttpContext, Guard, Handler } from "./types";

type Window = { count: number; resetAt: number };

/**
 * Counts per key in fixed windows, in this process's memory: right for one API
 * server. Running several, move the counts to a shared store (e.g. Redis) here.
 */
export class RateCounter {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Count one attempt; returns the window after counting it. */
  hit(key: string): Window {
    const time = this.now();
    let window = this.windows.get(key);
    if (!window || window.resetAt <= time) {
      if (this.windows.size > 10_000) this.forgetExpired(time);
      window = { count: 0, resetAt: time + this.windowMs };
      this.windows.set(key, window);
    }
    window.count++;
    return window;
  }

  /** Attempts counted for `key` in its current window (0 once it has ended). */
  count(key: string): Window | null {
    const window = this.windows.get(key);
    return window && window.resetAt > this.now() ? window : null;
  }

  private forgetExpired(time: number) {
    for (const [key, window] of this.windows) if (window.resetAt <= time) this.windows.delete(key);
  }
}

/**
 * Guard allowing `max` requests per key in each window, then 429 Too Many
 * Requests until the window ends. `key` picks what is counted (IP, IP and
 * account…); returning null skips counting. A max of 0 turns it off.
 */
function tooMany(resetAt: number): AppError {
  const minutes = Math.max(1, Math.ceil((resetAt - Date.now()) / 60_000));
  return new AppError(
    429,
    ERROR_CODES.TOO_MANY_REQUESTS,
    `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
  );
}

export function rateLimit(options: {
  name: string;
  max: number;
  windowMinutes: number;
  key: (ctx: AnyHttpContext) => string | null;
  counter?: RateCounter;
}): Guard {
  const counter = options.counter ?? new RateCounter(options.windowMinutes * 60_000);
  return (ctx) => {
    if (options.max <= 0) return;
    const key = options.key(ctx);
    if (key === null) return;
    const window = counter.hit(`${options.name}:${key}`);
    if (window.count > options.max) throw tooMany(window.resetAt);
  };
}

/**
 * Like rateLimit, but only failed requests count, e.g. wrong passwords (a
 * person signing in successfully again and again is never locked out). Put
 * `guard` on the route and wrap its handler with `counting`: a request that
 * fails with one of `statuses` counts against its key; `max` failures in a
 * window refuse the next requests with 429 until it ends.
 */
export function failureLimit(options: {
  name: string;
  max: number;
  windowMinutes: number;
  key: (ctx: AnyHttpContext) => string | null;
  /** Default: 401 (wrong credentials) and 404 (no such account). */
  statuses?: readonly number[];
  counter?: RateCounter;
}): { guard: Guard; counting: (handler: Handler) => Handler } {
  const counter = options.counter ?? new RateCounter(options.windowMinutes * 60_000);
  const statuses = options.statuses ?? [401, 404];
  const keyOf = (ctx: AnyHttpContext) => {
    const key = options.key(ctx);
    return key === null ? null : `${options.name}:${key}`;
  };
  return {
    guard: (ctx) => {
      const key = options.max > 0 ? keyOf(ctx) : null;
      const window = key ? counter.count(key) : null;
      if (window && window.count >= options.max) throw tooMany(window.resetAt);
    },
    counting: (handler) => async (ctx) => {
      try {
        return await handler(ctx);
      } catch (error) {
        const key = keyOf(ctx);
        if (key && error instanceof AppError && statuses.includes(error.statusCode))
          counter.hit(key);
        throw error;
      }
    },
  };
}
