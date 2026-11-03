# Personal Finance Backend

Express + Sequelize (PostgreSQL) API for the Personal Finance System. Built as a
long-lived skeleton: every third-party library sits behind one folder, so a
library can be swapped without touching business code.

## Local setup

Needs Node 22.12+ (see `.nvmrc`) and PostgreSQL.

```bash
npm install
cp .env.example .env   # then set DATABASE_PASSWORD and JWT_SECRET
npm run db:migrate     # builds, then applies migrations
npm run db:seed        # builds, then seeds users, accounts, reference data
npm run dev            # http://localhost:3001/api
```

`JWT_SECRET` is required; the app refuses to start without it. `.env.example`
shows how to generate one.

## Commands

| Command              | What it does                                              |
| -------------------- | --------------------------------------------------------- |
| `npm run dev`        | Start with reload on save                                 |
| `npm run build`      | Compile to `dist/`                                        |
| `npm start`          | Run the compiled app                                      |
| `npm run typecheck`  | TypeScript check                                          |
| `npm run lint`       | ESLint, including the architecture rules below            |
| `npm run format`     | Format with Prettier (`format:check` only checks)         |
| `npm test`           | Unit tests (Vitest, no database needed)                   |
| `npm run check`      | Everything CI runs: typecheck, lint, format, tests, build |
| `npm run db:migrate` | Apply migrations (`db:migrate:undo` to roll back one)     |
| `npm run db:seed`    | Seed data (`db:seed:undo` to remove)                      |

Run `npm run check` before every commit.

## Project structure

```
src/
├── main.ts                  # start: connect database, listen
├── app.ts                   # build the HTTP app from the module list
├── config/
│   ├── configuration.ts     # every setting, typed, in one object
│   └── database.config.ts   # database settings (shared with migration CLI)
├── infrastructure/          # THE ONLY FOLDER THAT USES LIBRARIES
│   ├── http/                # web framework (Express) adapter + route types
│   ├── database/            # ORM (Sequelize): connection, models, query helpers,
│   │                        #   migrations, seeders
│   ├── token.ts             # JWT sign / verify
│   ├── env.ts               # reads .env and process.env
│   └── logger.ts            # JSON logger
├── common/                  # shared, library-free building blocks
│   ├── enums/               # domain enums (AccountType, …)
│   ├── errors/              # AppError, ERROR_CODES
│   ├── guards/              # authenticate, currentUserId
│   ├── responses/           # response envelope
│   ├── validation/          # reusable checks (isUuid, isDate, assertPageQuery…)
│   ├── utils/               # reference-code formatters
│   └── pagination.ts        # parsePageQuery, buildPaginatedData
├── modules/
│   ├── index.ts             # the list of modules the API serves
│   └── <feature>/           # account, auth, health, transaction, user
└── test/                    # test helpers
```

## One place for libraries

`src/infrastructure` is the only folder allowed to import a third-party package
or read `process.env`. ESLint fails the build if anything else does. Everything
else imports our own wrappers:

| Need                         | Use                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------- |
| Define routes                | `ApiModule`, `Route`, `Guard`, `HttpContext` from `infrastructure/http`         |
| Read a setting               | `configuration` from `config/configuration`                                     |
| Query the database           | models and `containsText`, `between`, `matchAny` from `infrastructure/database` |
| Detect a duplicate-key error | `isUniqueViolation` from `infrastructure/database`                              |
| Issue or check a token       | `signToken`, `verifyToken` from `infrastructure/token`                          |
| Log                          | `logger` from `infrastructure/logger`                                           |

**Swapping a library** means rewriting the matching file in `infrastructure/`
and nothing else. For example, moving from Express to Fastify only changes
`infrastructure/http/express-app.ts`. Changing the ORM changes `infrastructure/database`
and the repository files (the repositories are the database layer of each module).

**Using a new library:** install it, wrap it in a small file in
`infrastructure/` with our own function names and types, and import the wrapper.

## Modules

Each feature follows the same layout. `account` is the reference:

```
src/modules/account/
├── account.module.ts        # path, guards and routes (plain data)
├── account.controller.ts    # maps the request to service arguments
├── account.service.ts       # business rules; returns plain data
├── account.repository.ts    # database access, always scoped by userId
├── account.validator.ts     # guards that throw AppError on bad input
├── account.id-generator.ts  # pure helper
├── dto/account.dto.ts       # request shapes
└── types/account.type.ts    # response shape
```

Rules of each layer:

- **Module:** routes are matched in order, so put fixed paths (`/active-dropdown`)
  before parameter paths (`/:id`). Module `guards` run for every request under
  the path.
- **Controller:** one line per handler. Return the data; the HTTP layer wraps it
  in the response envelope and sets the status (`status: 201` on the route).
- **Service:** no HTTP or database code. Throw `AppError` for business errors.
- **Repository:** the only place that touches models.
- **Validator:** throw with `validationError(...)` or `new AppError(...)`. Guards
  may normalise `ctx.body` in place.

### Adding a module

1. Create `src/modules/<name>/` with the files above (copy `account`).
2. If it needs a new table: add a model in `infrastructure/database/models/`,
   register it in `connection.ts` and export it from `infrastructure/database/index.ts`,
   then add a migration in `infrastructure/database/migrations/`.
3. Add one line to `src/modules/index.ts`.
4. Add tests next to the code (`*.test.ts`) for validators and pure helpers.

Nothing else changes.

## Response envelope

Every endpoint returns the same shape:

```jsonc
{
  "success": true,
  "data": {/* endpoint payload */},
  "meta": null, // reserved transport meta
  "requestId": "…",
}
```

```jsonc
{
  "success": false,
  "error": { "code": "ACCOUNT_NOT_FOUND", "message": "Account not found." },
  "requestId": "…",
}
```

List endpoints nest pagination **inside** `data`:

```jsonc
{
  "success": true,
  "data": {
    "items": [/* … */],
    "pagination": { "page": 1, "limit": 20, "total": 4, "totalPages": 1 },
  },
}
```

Send `X-Request-Id` to trace a request; otherwise one is generated and echoed
back in the `X-Request-Id` header.

## Authentication

Every resource endpoint (`/users`, `/accounts`, `/transactions`) requires a JWT:
`Authorization: Bearer <token>`. The authenticated user is the **only** source
of ownership; the client never sends `userId`.

For local testing, mint a token for a seeded user:

```bash
curl -X POST http://localhost:3001/api/auth/token \
  -H 'Content-Type: application/json' \
  -d '{ "userId": "<uuid>" }'
# -> { "data": { "accessToken": "…", "tokenType": "Bearer", "expiresIn": "7d" } }
```

This endpoint needs no password, so it is **off in production** unless
`AUTH_ALLOW_DEV_TOKENS=true`. Replace it with a real login before going live.
`POST /api/auth/token/validate` checks a token.

---

## Accounts API

Base path: `/api/accounts` — all routes require JWT auth.

| Method | Path                            | Description                                                  |
| ------ | ------------------------------- | ------------------------------------------------------------ |
| GET    | `/api/accounts`                 | List the caller's accounts                                   |
| GET    | `/api/accounts/active-dropdown` | Active accounts for a dropdown (`search`, default limit 100) |
| GET    | `/api/accounts/:id`             | Get one account (owned)                                      |
| POST   | `/api/accounts`                 | Create an account                                            |
| PATCH  | `/api/accounts/:id`             | Update an account (owned)                                    |
| DELETE | `/api/accounts/:id`             | Soft-delete / deactivate                                     |

### Account model

| Field                     | Type                               | Notes                                     |
| ------------------------- | ---------------------------------- | ----------------------------------------- |
| `id`                      | UUID                               | Primary key                               |
| `accountId`               | string                             | `ACC000001` — generated, unique per user  |
| `accountName`             | string                             | Required                                  |
| `bank`                    | string                             | Required                                  |
| `accountNumber`           | string \| null                     | Optional, unique per user when set        |
| `customerNumber`          | string \| null                     | Optional                                  |
| `ifsc`                    | string \| null                     | Optional, normalised to uppercase         |
| `type`                    | `saving` \| `current`              | Required                                  |
| `status`                  | `active` \| `inactive` \| `closed` | Defaults to `active`                      |
| `currentBalance`          | string (DECIMAL 15,2)              | Not editable here (owned by transactions) |
| `openingDate`             | string \| null (`YYYY-MM-DD`)      | Optional                                  |
| `closingDate`             | string \| null (`YYYY-MM-DD`)      | Auto-set when status becomes `closed`     |
| `userId`                  | UUID                               | From JWT — never accepted from the client |
| `createdAt` / `updatedAt` | datetime                           |                                           |

### List — `GET /api/accounts`

Query params (all optional):

- `page` (default 1), `limit` (default 10, max 100)
- `status` — `active` | `inactive` | `closed`
- `type` — `saving` | `current`
- `bank` — case-insensitive contains match
- `search` — matches `accountName`, `bank`, `accountId`, `accountNumber`

Only the authenticated user's accounts are returned.

### Create — `POST /api/accounts`

```jsonc
{
  "accountName": "HDFC Salary Account - Chennai",
  "bank": "HDFC",
  "accountNumber": "50100475309311",
  "customerNumber": "181378668",
  "ifsc": "HDFC0000260",
  "type": "saving",
  "status": "active",
  "openingDate": null,
  "closingDate": null,
  "currentBalance": 32941, // optional initial balance only
}
```

- `accountId` is generated (`ACC000001`, `ACC000002`, …) — do **not** send it.
- `id` / `userId` / `accountId` in the body are rejected with `VALIDATION_ERROR`.
- Returns `201` with the created account.

### Update — `PATCH /api/accounts/:id`

Accepts any subset of: `accountName`, `bank`, `accountNumber`, `customerNumber`,
`ifsc`, `type`, `status`, `openingDate`, `closingDate`.

- `id`, `userId`, `accountId`, `currentBalance` are **rejected** — balance is
  owned by the (future) transaction module.
- Setting `status: "closed"` auto-populates `closingDate` when not supplied.

### Delete — `DELETE /api/accounts/:id`

Soft delete. If the account has transactions, it is refused with
`ACCOUNT_HAS_TRANSACTIONS` (409); otherwise its `status` is set to `inactive`.

### Error codes

`VALIDATION_ERROR`, `UNAUTHORIZED`, `TOKEN_EXPIRED`, `FORBIDDEN`,
`ACCOUNT_NOT_FOUND`, `ACCOUNT_ALREADY_EXISTS`, `ACCOUNT_HAS_TRANSACTIONS`,
`INVALID_ACCOUNT_TYPE`, `INVALID_ACCOUNT_STATUS`, `DATABASE_ERROR`.

Ownership violations return `ACCOUNT_NOT_FOUND` (404) rather than leaking the
existence of another user's account. Raw database errors are never exposed.

## Skeleton version

`skeleton.json` holds the skeleton version and `SKELETON_CHANGELOG.md` lists
what each version changed. Structural changes are made on the `skeleton` branch
first, verified, then merged into the working branch.
