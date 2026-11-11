import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      // Generated once and frozen; they run as plain CommonJS under sequelize-cli.
      "src/infrastructure/database/migrations/**",
      "src/infrastructure/database/seeders/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Object shapes are declared with `type`, never `interface`.
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // src/infrastructure is the only folder that may use third-party packages or
  // read the environment. Everything else imports its wrappers, so swapping a
  // library (web framework, ORM, JWT, logger) never touches business code.
  {
    files: ["src/**/*.ts"],
    ignores: ["src/infrastructure/**", "src/**/*.test.ts", "src/test-e2e/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!\\.|node:)",
              message:
                "Third-party packages are only imported in src/infrastructure. Wrap it there and import the wrapper.",
            },
            {
              regex: "infrastructure/(database|http)/.+",
              message: "Import from the folder's index (e.g. '../../infrastructure/database').",
            },
            {
              // Shared code has one entry point. (src/infrastructure is exempt:
              // it sits below common and imports its files directly to avoid a cycle.)
              regex: "(^|/)common/.+",
              message: "Import shared code from the common index (e.g. '../../common').",
            },
          ],
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message: "Read settings from src/config/configuration.ts.",
        },
      ],
      "no-console": ["error"],
    },
  },
  // API tests read loosely typed response bodies.
  {
    files: ["src/test-e2e/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);
