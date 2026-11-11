import { defineConfig } from "vitest/config";

// Unit tests live next to the code as *.test.ts; shared fakes are in src/test-support.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
    environment: "node",
    env: { JWT_SECRET: "test-secret", NODE_ENV: "test" },
    restoreMocks: true,
    unstubEnvs: true,
  },
});
