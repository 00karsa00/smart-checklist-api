import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadConfiguration() {
  return (await import("./configuration.js")).configuration;
}

describe("configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("refuses to start without JWT_SECRET", async () => {
    vi.stubEnv("JWT_SECRET", "");
    await expect(loadConfiguration()).rejects.toThrow(
      "Missing required environment variable JWT_SECRET",
    );
  });

  it("allows dev tokens outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect((await loadConfiguration()).auth.allowDevTokens).toBe(true);
  });

  it("turns dev tokens off in production unless explicitly allowed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await loadConfiguration()).auth.allowDevTokens).toBe(false);

    vi.resetModules();
    vi.stubEnv("AUTH_ALLOW_DEV_TOKENS", "true");
    expect((await loadConfiguration()).auth.allowDevTokens).toBe(true);
  });
});
