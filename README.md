# API Skeleton

Express + Sequelize (PostgreSQL) backend skeleton with no business code. Every
third-party library sits behind one folder, and every shared helper exists once,
so the foundation can last for years. Start a project by copying the reference
`item` module.

## Local setup

Needs Node 22.12+ (see `.nvmrc`) and PostgreSQL.

```bash
npm install
cp .env.example .env   # set APP_NAME, DATABASE_*, and JWT_SECRET
npm run db:migrate     # builds, then applies migrations (none yet)
npm run dev            # http://localhost:3001/api
```

`JWT_SECRET` is required; the app refuses to start without it. `.env.example`
shows how to generate one.

Try it:

```bash
curl http://localhost:3001/api/health
TOKEN=$(curl -s -X POST localhost:3001/api/auth/token -H 'Content-Type: application/json' \
  -d '{"userId":"4b2c77c8-e65b-4232-a395-57bce4f05b86"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.accessToken')
curl -X POST localhost:3001/api/items -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"First item"}'
curl localhost:3001/api/items -H "Authorization: Bearer $TOKEN"
```

## Commands

| Command              | What it does                                                          |
| -------------------- | --------------------------------------------------------------------- |
| `npm run dev`        | Start with reload on save                                             |
| `npm run build`      | Compile to `dist/`                                                    |
| `npm start`          | Run the compiled app                                                  |
| `npm run typecheck`  | TypeScript check                                                      |
| `npm run lint`       | ESLint, including the architecture rules below                        |
| `npm run format`     | Format with Prettier (`format:check` only checks)                     |
| `npm test`           | Unit tests (Vitest, no database needed)                               |
| `npm run dup:check`  | Fail if the same block of code appears in two places                  |
| `npm run check`      | Everything CI runs: typecheck, lint, duplicates, format, tests, build |
| `npm run db:migrate` | Apply migrations (`db:migrate:undo` to roll back one)                 |
| `npm run db:seed`    | Run seeders (`db:seed:undo` to remove)                                |

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
│   ├── database/            # ORM (Sequelize): connection, query helpers,
│   │                        #   models/, migrations/, seeders/ (empty)
│   ├── token.ts             # JWT sign / verify
│   ├── env.ts               # reads .env and process.env
│   └── logger.ts            # JSON logger
├── common/                  # shared, library-free building blocks
│   ├── errors/              # AppError, ERROR_CODES
│   ├── guards/              # authenticate, currentUserId, requireValidToken
│   ├── responses/           # response envelope
│   ├── validation/          # reusable checks and guards
│   ├── utils/               # assignDefined
│   └── pagination.ts        # parsePageQuery, pageOffset, buildPaginatedData
├── modules/
│   ├── index.ts             # the list of modules the API serves
│   ├── health/              # GET /health
│   ├── auth/                # development tokens
│   └── item/                # reference module: copy it for new features
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
`infrastructure/http/express-app.ts`. Changing the ORM changes
`infrastructure/database` and the repository files (the repositories are the
database layer of each module).

**Using a new library:** install it, wrap it in a small file in
`infrastructure/` with our own function names and types, and import the wrapper.

## Reuse before you write

Every reusable function, type, and helper exists **once**. Before writing a new
one, search `src/common` and `src/infrastructure` and use what is there. If it
needs to behave differently, change the original (or add a parameter) so every
caller gets the change. Never copy it into a second version.

| Need                                             | Single source                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Validate `/:id`                                  | `idParamGuard("Entity")` in `common/validation/rules`                              |
| Partial update needs at least one field          | `assertAtLeastOne`                                                                 |
| Fields the client may not send                   | `rejectFields`                                                                     |
| Check a field only when it was sent              | `assertOptional` (with `orNull(...)` to also allow null)                           |
| UUID, date, email, number, enum checks           | `isUuid`, `isDate`, `isEmail`, `isPositiveNumber`, `isOneOf`, …                    |
| `?page=&limit=`                                  | `assertPageQuery`, `parsePageQuery`, `pageOffset`, `buildPaginatedData`            |
| Copy sent fields onto a record in an update      | `assignDefined` in `common/utils/assign-defined`                                   |
| Signed-in user / token check                     | `authenticate`, `currentUserId`, `requireValidToken` in `common/guards/auth.guard` |
| "Does this record exist and belong to the user?" | the owning service's `get…ById` (e.g. `itemService.getItemById`)                   |
| Route param and empty types                      | `IdParams`, `NoParams` from `infrastructure/http`                                  |
| Database query helpers                           | `containsText`, `between`, `matchAny`, `isUniqueViolation`                         |

`npm run dup:check` (part of `npm run check` and CI) fails when two places
contain the same block of code. Fix it by moving the code into one shared
function and calling it from both places.

## Modules

Each feature follows the same layout. `item` is the reference:

```
src/modules/item/
├── item.module.ts        # path, guards and routes (plain data)
├── item.controller.ts    # maps the request to service arguments
├── item.service.ts       # business rules; returns plain data
├── item.repository.ts    # data access, always scoped by userId
├── item.validator.ts     # guards that throw AppError on bad input
├── item.*.test.ts        # service and validator tests
├── dto/item.dto.ts       # request shapes
└── types/item.type.ts    # response shape
```

Rules of each layer:

- **Module:** routes are matched in order, so put fixed paths (`/active`)
  before parameter paths (`/:id`). Module `guards` run for every request under
  the path.
- **Controller:** one line per handler. Return the data; the HTTP layer wraps it
  in the response envelope and sets the status (`status: 201` on the route).
- **Service:** no HTTP or database code. Throw `AppError` for business errors.
  Take the repository in the constructor so tests can pass a fresh one.
- **Repository:** the only place that touches models.
- **Validator:** throw with `validationError(...)` or `new AppError(...)`, using
  the shared rules. Guards may normalise `ctx.body` in place.

### Adding a module

1. Copy `src/modules/item/` to `src/modules/<name>/` and rename.
2. For a database table:
   - add a model in `infrastructure/database/models/`, register it in
     `connection.ts` (`MODELS`) and export it from `infrastructure/database/index.ts`;
   - add a migration in `infrastructure/database/migrations/` (and seeders if needed);
   - replace the in-memory body of the repository with model queries, keeping
     its method names.
3. Add the module's error codes to `common/errors/error.codes.ts`.
4. Add one line to `src/modules/index.ts`.
5. Update the tests next to the code.

Nothing else changes. Delete the `item` module once you no longer need it as a
reference (remove its line from `modules/index.ts` and its error code).

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
  "error": { "code": "ITEM_NOT_FOUND", "message": "Item not found." },
  "requestId": "…",
}
```

List endpoints nest pagination **inside** `data`:

```jsonc
{
  "success": true,
  "data": {
    "items": [/* … */],
    "pagination": { "page": 1, "limit": 10, "total": 4, "totalPages": 1 },
  },
}
```

Send `X-Request-Id` to trace a request; otherwise one is generated and echoed
back in the `X-Request-Id` header.

## Authentication

Protected modules add `guards: [authenticate]` and read the caller with
`currentUserId(ctx)`. The signed-in user is the **only** source of ownership;
clients never send `userId`.

For local testing, `POST /api/auth/token` with `{ "userId": "<uuid v4>" }`
returns a token, and `POST /api/auth/token/validate` checks one. The token
endpoint needs no password, so it is **off in production** unless
`AUTH_ALLOW_DEV_TOKENS=true`. When the project adds users, check the user in
`auth.service.ts` and replace the endpoint with a real login.

## Item API (reference module)

Base path `/api/items`; all routes require a token. Items are kept in memory
and reset when the server restarts.

| Method | Path             | Description                                           |
| ------ | ---------------- | ----------------------------------------------------- |
| GET    | `/api/items`     | List your items (`page`, `limit` ≤ 100, `search`)     |
| GET    | `/api/items/:id` | Get one item                                          |
| POST   | `/api/items`     | Create `{ name, description? }`; name unique per user |
| PATCH  | `/api/items/:id` | Update `name` and/or `description`                    |
| DELETE | `/api/items/:id` | Delete                                                |

## Skeleton version

`skeleton.json` holds the skeleton version and `SKELETON_CHANGELOG.md` lists
what each version changed. Structural changes are made on the `skeleton` branch
first, verified, then merged into the working branch.
