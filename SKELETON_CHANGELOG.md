# Skeleton changelog

Changes to the backend skeleton. Versions follow [Semantic Versioning](https://semver.org/): a major version may need changes in modules, minor versions add features, patch versions fix bugs.

## 1.1.0 — 2026-11-03

One implementation for every shared helper. API responses are unchanged (verified by replaying 75 requests) except one message: `POST /api/auth/token/validate` errors now end with a period ("Invalid token.", "Token has expired."), the same as every other auth error.

- **Validation helpers:** `idParamGuard`, `assertAtLeastOne`, `rejectFields`, `assertOptional`, `orNull` replace per-module copies; all three modules use them.
- **Services reuse lookups:** account and transaction services use their own `get…ById` for existence checks; the transaction service checks account ownership through `accountService.getAccountById`.
- **One page-offset calculation** (`pageOffset`), one partial-update helper (`assignDefined`), one sequence padder (`padSequence`), one token check (`requireValidToken`).
- **Shared types:** `IdParams` and `NoParams` from `infrastructure/http`; list queries extend `PageQuery`.
- **`npm run dup:check`** (jscpd) fails on duplicated code; part of `npm run check` and CI.
- README section "Reuse before you write" lists the single source for each need.

## 1.0.0 — 2026-11-03

First release.

- **One library layer:** `src/infrastructure` is the only folder that imports third-party packages or reads `process.env`. ESLint blocks library imports, deep infrastructure imports, `process.env` and `console` everywhere else.
- **HTTP:** modules declare routes as data (`ApiModule`, `Route`, `Guard`). One adapter (`infrastructure/http/express-app.ts`) builds the Express app and adds the response envelope, request id, logging, 404 and error handling. Controllers return data only.
- **Database:** `infrastructure/database` exports the connection, models and query helpers (`containsText`, `between`, `matchAny`, `isUniqueViolation`). Migrations reuse the app's database settings.
- **Auth:** `infrastructure/token` wraps JWT; the `authenticate` guard protects whole modules.
- **Shared code:** `common/validation` rules, `common/pagination`, `common/enums`, one response envelope for every endpoint.
- **Config:** one typed `configuration`. `JWT_SECRET` is required.
- **Quality:** Vitest unit tests, ESLint, Prettier, GitHub Actions CI, Dependabot. TypeScript 5.

Behaviour changes from the pre-skeleton code (all other responses are unchanged, verified by replaying 75 API requests before and after):

- `GET /api/accounts/active-dropdown` works (it was shadowed by `/:id`).
- `/api/users` requires a token.
- `/api/users` and `/api/health` use the standard envelope (`meta: null`, top-level `requestId`).
- `POST /api/auth/token` is off in production unless `AUTH_ALLOW_DEV_TOKENS=true`.
- The app refuses to start without `JWT_SECRET` (it used to fall back to a public default).
