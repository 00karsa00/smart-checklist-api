import { defineConfig } from "vitest/config";

// Unit tests for plain TypeScript. No database: repositories are not loaded.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    env: { JWT_SECRET: "test-secret", NODE_ENV: "test" },
    restoreMocks: true,
    unstubEnvs: true,
  },
});
