import { afterEach, describe, expect, it, vi } from "vitest";

import { readNumberEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("readNumberEnv", () => {
  it("reads numbers, 0 included", () => {
    vi.stubEnv("E2E_NUMBER", "0");
    expect(readNumberEnv("E2E_NUMBER", 7)).toBe(0);
    vi.stubEnv("E2E_NUMBER", "25");
    expect(readNumberEnv("E2E_NUMBER", 7)).toBe(25);
  });

  it("falls back when missing, blank or not a number", () => {
    expect(readNumberEnv("E2E_MISSING", 7)).toBe(7);
    vi.stubEnv("E2E_NUMBER", " ");
    expect(readNumberEnv("E2E_NUMBER", 7)).toBe(7);
    vi.stubEnv("E2E_NUMBER", "ten");
    expect(readNumberEnv("E2E_NUMBER", 7)).toBe(7);
  });
});
