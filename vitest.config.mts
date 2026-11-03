import { defineConfig } from "vitest/config";

// Unit tests live next to the code as *.test.ts. None yet: passWithNoTests keeps
// `npm test` and CI green until the first one is added.
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
