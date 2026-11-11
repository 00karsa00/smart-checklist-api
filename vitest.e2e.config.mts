import { defineConfig } from "vitest/config";

// API tests (src/test-e2e/*.e2e.ts): the real app and the database in .env.
// They create and remove their own "e2e-" accounts. Run with npm run test:e2e.
export default defineConfig({
  test: {
    include: ["src/test-e2e/**/*.e2e.ts"],
    environment: "node",
    // One file at a time: they share the database.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Outside production the per-IP sign-in limits are off; the per-account
    // limit stays on, so its test can check it.
    env: { NODE_ENV: "test" },
  },
});
