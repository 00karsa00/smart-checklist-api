# Smart Personal Checklist API

The backend of Smart Personal Checklist: tasks, projects, reminders, habits and
goals for one person's life and work. Express + Sequelize (PostgreSQL), built on
the shared API skeleton: every third-party library sits behind one folder, and
every shared helper exists once. Start a new module by copying the reference
`item` module.

## Local setup

Needs Node 22.12+ (see `.nvmrc`) and PostgreSQL.

```bash
npm install
cp .env.example .env   # set APP_NAME, DATABASE_*, JWT_SECRET, ADMIN_SEED_PASSWORD
npm run db:migrate     # builds, then creates the admin tables
npm run db:seed        # creates the first admin from ADMIN_SEED_*
npm run dev            # http://localhost:3001/api
```

`JWT_SECRET` is required; the app refuses to start without it. `.env.example`
shows how to generate one.

Try it:

```bash
curl http://localhost:3001/api/health
curl -X POST localhost:3001/api/auth/admin/identify -H 'Content-Type: application/json' \
  -d '{"userName":"admin"}'
TOKEN=$(curl -s -X POST localhost:3001/api/auth/admin/login -H 'Content-Type: application/json' \
  -d '{"userName":"admin","password":"<ADMIN_SEED_PASSWORD>"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.accessToken')
curl localhost:3001/api/auth/admin/me -H "Authorization: Bearer $TOKEN"
curl localhost:3001/api/items -H "Authorization: Bearer $TOKEN"
```

## Commands

| Command                | What it does                                                          |
| ---------------------- | --------------------------------------------------------------------- |
| `npm run dev`          | Start with reload on save                                             |
| `npm run build`        | Compile to `dist/`                                                    |
| `npm start`            | Run the compiled app                                                  |
| `npm run typecheck`    | TypeScript check                                                      |
| `npm run lint`         | ESLint, including the architecture rules below                        |
| `npm run format`       | Format with Prettier (`format:check` only checks)                     |
| `npm test`             | Unit tests (Vitest; `*.test.ts` next to the code)                     |
| `npm run test:e2e`     | API tests against the database in `.env` (see "API tests" below)      |
| `npm run test:cleanup` | Remove test accounts (`e2e-…`) left by API or browser tests           |
| `npm run test:admins`  | Make the two admins the web app's browser tests sign in as            |
| `npm run dup:check`    | Fail if the same block of code appears in two places                  |
| `npm run check`        | Everything CI runs: typecheck, lint, duplicates, format, tests, build |
| `npm run db:migrate`   | Apply migrations (`db:migrate:undo` to roll back one)                 |
| `npm run db:seed`      | Run seeders (`db:seed:undo` to remove)                                |

Run `npm run check` before every commit.

### API tests

`src/test-e2e/*.e2e.ts` test the API from the outside: each file starts the real app on a free port against the database in `.env` (no running server needed), signs up its own users and admins (names starting with `e2e-`) and removes them when it ends. They cover sign-in and sessions (refresh rotation, a just-replaced token reused within the grace period, a stolen one used after it, the per-account sign-in limit), disabled accounts, sign-up switched off, managing admins and users (roles, self-protection, password resets, login logs), profile, settings, password changes and signed-in devices, workspaces and projects (starter set, unique names, ordering, filters, moving, archiving, the rules for deleting, one user never reaching another's), categories and tags (both kinds, the suggested set), tasks (placement, subtasks, ordering, every filter, completing, moving, what deleting a project, category, tag or workspace does), task reminders and due-date alerts (once each, muting, a moved reminder), notifications (sources, read state, muting), and the admin overview and audit log. They are not part of `npm run check`, which needs no database; run `npm run test:e2e` after changing behaviour and before a release. If a run is stopped half-way, `npm run test:cleanup` removes what it left.

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
│   ├── password.ts          # password hash / verify (scrypt)
│   ├── env.ts               # reads .env and process.env
│   └── logger.ts            # JSON logger
├── common/                  # shared, library-free building blocks
│   ├── index.ts             # THE ONE IMPORT for all shared code
│   ├── errors/              # AppError, ERROR_CODES
│   ├── guards/              # authenticate, currentUserId, requireValidToken
│   ├── responses/           # response envelope
│   ├── validation/          # reusable checks and guards
│   ├── utils/               # assignDefined
│   └── pagination.ts        # parsePageQuery, pageOffset, buildPaginatedData
├── modules/
│   ├── index.ts             # the list of modules the API serves
│   ├── health/              # GET /health
│   ├── auth/                # sign-in (identify → login → JWT), /me, login log
│   ├── admin/               # admin users and their secrets (no routes)
│   └── item/                # reference module: copy it for new features
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
| Hash or check a password     | `hashPassword`, `verifyPassword` from `infrastructure/password`                 |
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

All shared code is imported from **one place**, the common index:

```ts
import { AppError, ERROR_CODES, currentUserId, idParamGuard, parsePageQuery } from "../../common";
```

ESLint rejects imports of files inside `common/`. To add a shared helper, put it
in the right file under `src/common/` and export it from `src/common/index.ts`.

| Need                                             | Single source                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| Validate `/:id`                                  | `idParamGuard("Entity")`                                                |
| Partial update needs at least one field          | `assertAtLeastOne`                                                      |
| Fields the client may not send                   | `rejectFields`                                                          |
| Check a field only when it was sent              | `assertOptional` (with `orNull(...)` to also allow null)                |
| UUID, date, email, number, enum checks           | `isUuid`, `isDate`, `isEmail`, `isPositiveNumber`, `isOneOf`, …         |
| `?page=&limit=`                                  | `assertPageQuery`, `parsePageQuery`, `pageOffset`, `buildPaginatedData` |
| Copy sent fields onto a record in an update      | `assignDefined`                                                         |
| Signed-in user / token check                     | `authenticate`, `currentUserId`, `requireValidToken`                    |
| "Does this record exist and belong to the user?" | the owning service's `get…ById` (e.g. `itemService.getItemById`)        |
| Route param and empty types                      | `IdParams`, `NoParams` from `infrastructure/http`                       |
| Database query helpers                           | `containsText`, `between`, `matchAny`, `isUniqueViolation`              |

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
├── dto/item.dto.ts       # request shapes
└── types/item.type.ts    # response shape
```

Rules of each layer:

- **Module:** routes are matched in order, so put fixed paths (`/active`)
  before parameter paths (`/:id`). Module `guards` run for every request under
  the path.
- **Files:** a route with `rawBody: { types, maxBytes }` receives the upload
  as a Buffer in `ctx.body`; a handler that returns `fileResponse(...)` sends
  bytes instead of the envelope. Store files through `fileStorage`.
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
3. Add the module's error codes to `src/common/errors/error.codes.ts`.
4. Add one line to `src/modules/index.ts`.
5. Add tests next to the code (`<name>.service.test.ts`, `<name>.validator.test.ts`).
   In-memory fakes for secrets, sessions and request contexts are in
   `src/test-support/fakes.ts` (kept out of the build).

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

Two kinds of account sign in, each in two steps so every account can use a
different login method. Admins use a user name; users use their email or phone.

| Method | Path                       | Body / auth                          | Returns                                      |
| ------ | -------------------------- | ------------------------------------ | -------------------------------------------- |
| POST   | `/api/auth/admin/identify` | `{ userName }`                       | `{ userName, loginMethod }`                  |
| POST   | `/api/auth/admin/login`    | `{ userName, password }`             | tokens + `user` (see below)                  |
| POST   | `/api/auth/admin/refresh`  | `{ refreshToken }`                   | a new token pair + `user`                    |
| POST   | `/api/auth/admin/logout`   | `{ refreshToken }`                   | `null` (ends that session)                   |
| GET    | `/api/auth/admin/me`       | `Authorization: Bearer <jwt>`        | the signed-in admin, with role + permissions |
| POST   | `/api/auth/user/register`  | `{ name, email?, phone?, password }` | 201, tokens + `user`                         |
| POST   | `/api/auth/user/identify`  | `{ identifier }`                     | `{ identifier, loginMethod }`                |
| POST   | `/api/auth/user/login`     | `{ identifier, password }`           | tokens + `user`                              |
| POST   | `/api/auth/user/refresh`   | `{ refreshToken }`                   | a new token pair + `user`                    |
| POST   | `/api/auth/user/logout`    | `{ refreshToken }`                   | `null` (ends that session)                   |
| GET    | `/api/auth/user/me`        | `Authorization: Bearer <jwt>`        | the signed-in user (401 once deactivated)    |
| POST   | `/api/auth/token/validate` | `{ token }`                          | token claims, including `kind`               |

Login, register and refresh return `{ accessToken, tokenType, expiresIn,
refreshToken, refreshExpiresAt, user }`.

**Sessions.** The access token is a short JWT (`JWT_EXPIRES_IN`, default
15m) naming its session (`sid`). The refresh token is random; only its
SHA-256 hash is stored, one row per session (`admin_session`,
`app_user_session`), valid for `REFRESH_TOKEN_DAYS` (default 30). Each
refresh replaces the token inside the same session row (rotation), so a
session keeps one id from sign-in to sign-out. The token just replaced is
remembered: used again within a minute of being replaced, it gets a fresh
pair for the same session (another tab refreshed first, or a page was left
before it kept the reply, which used to sign the user out); repeats do not
extend that minute. Later reuse looks stolen and ends every session of the
account. Logout ends one session; changing your
password ends your other sessions; an admin's password reset or deactivation
ends all of them. A refused refresh token is 401 `REFRESH_TOKEN_INVALID`.

**Registration** creates an active, unverified user with password sign-in
and signs them in. Set `AUTH_ALLOW_REGISTRATION=false` to allow only
admin-created accounts (403 `REGISTRATION_DISABLED`).

Identify and login answer 404 for an unknown account and 403
`ACCOUNT_INACTIVE` for a deactivated one. Each token carries `kind`
(`"admin"` or `"user"`): `authenticateAs("admin")` refuses other kinds with
403, so a user token never reaches admin endpoints.

Each kind has the same three tables: the account (`admin_user`, `app_user`),
one secret table per method (`admin_user_password`, `app_user_password`), and
a login log (`admin_login_log`, `app_user_login_log`) of every attempt with
result, failure code, IP and user agent.

`src/modules/accounts` holds what every kind shares: the password and
login-log repositories, `AccountSecrets`, the session guard
(`requireActiveAccount`) and common validators. A kind of account is an
`AccountDirectory` (the admin and user services implement it), which the auth
module signs in. To add another kind, add its three tables, implement
`AccountDirectory` in its service, and add its routes in `auth.module.ts`.

**Adding a login method** (e.g. OTP): add it to `LOGIN_METHODS`
(`modules/accounts/types/account.type.ts`), add its secret tables and models,
then one entry in `LOGIN_VERIFIERS` (`modules/auth/login-methods.ts`).
Accounts with that `login_method` start using it.

## Profile (self-service)

The signed-in account manages itself. Read the profile with `GET /api/auth/<kind>/me`.
`<kind>` is `user` or `admin`.

| Method | Path                                           | Body                               | Returns                        |
| ------ | ---------------------------------------------- | ---------------------------------- | ------------------------------ |
| PATCH  | `/api/profile/user`                            | any of `{ name, email, phone }`    | the updated user's session     |
| GET    | `/api/profile/user/settings`                   |                                    | the user's settings            |
| PATCH  | `/api/profile/user/settings`                   | any of the settings below          | all settings after the change  |
| POST   | `/api/profile/<kind>/password`                 | `{ currentPassword, newPassword }` | `null`                         |
| GET    | `/api/profile/<kind>/sessions`                 |                                    | signed-in devices              |
| DELETE | `/api/profile/<kind>/sessions/:id`             |                                    | `null` (signs that device out) |
| POST   | `/api/profile/<kind>/sessions/sign-out-others` |                                    | `null`                         |

Profile updates follow the same rules as admin edits (a user keeps an email or
a phone; a changed email or phone becomes unverified). A wrong current
password is 400 `CURRENT_PASSWORD_INCORRECT`, never 401, so the session stays;
a successful change signs out the account's other devices. Admins' user names
are changed by another admin through `/api/admin/users`.

**Settings** (`app_user_settings`, one row per user, created on the first
change; until then the defaults from `.env` are returned):

| Field          | Example        | Meaning                                        |
| -------------- | -------------- | ---------------------------------------------- |
| `currency`     | `INR`          | ISO 4217; how amounts are shown                |
| `locale`       | `en-IN`        | How numbers, dates and amounts are shown       |
| `timeZone`     | `Asia/Kolkata` | IANA; which calendar day something happened on |
| `weekStartsOn` | `1`            | 0 = Sunday … 6 = Saturday                      |

**Signed-in devices** lists the live sessions, most recently active first,
with `signedInAt`, `lastActiveAt`, IP, user agent and `current` (the device
asking). Signing out a device that is not yours, or already signed out, is 404
`SESSION_NOT_FOUND`.

## Admin roles

Every admin has a `role`; routes check a **permission**, never a role name
(`src/modules/admin/admin-roles.ts` is the only place that maps them).

| Role          | Permissions                                                |
| ------------- | ---------------------------------------------------------- |
| `super_admin` | `admins:read`, `admins:write`, `users:read`, `users:write` |
| `admin`       | `users:read`, `users:write`                                |
| `viewer`      | `users:read`                                               |

Guard a route with `adminCan("users:write")` (from `admin.module.ts`) behind
`authenticateAs("admin")`; it also requires the admin to still be active, so
a role change applies to existing tokens at once. A missing permission is 403.
New admins default to `admin`; admins created before roles existed became
`super_admin`. Nobody can change their own role. `GET /auth/admin/me`
returns `role` and `permissions` so clients can hide what an admin cannot use.
To add a role, add one entry to `ROLE_PERMISSIONS`.

## Admin and user management

Both need an active admin's token with the permission shown in brackets:
reads need `admins:read` / `users:read`, changes `admins:write` / `users:write`.

| Path                                       | Description                                                |
| ------------------------------------------ | ---------------------------------------------------------- |
| `GET/POST /api/admin/users`                | List (`page`, `limit`, `search`) / create admins           |
| `GET/PATCH /api/admin/users/:id`           | Get / update `userName`, `loginMethod`, `role`, `isActive` |
| `POST /api/admin/users/:id/reset-password` | `{ password }`                                             |
| `GET /api/admin/login-logs`                | Admin sign-in attempts                                     |
| `GET/POST /api/users`                      | List (search by name, email, phone) / create app users     |
| `GET/PATCH /api/users/:id`                 | Get / update name, email, phone, method, active, verified  |
| `POST /api/users/:id/reset-password`       | `{ password }`                                             |
| `GET /api/users/login-logs`                | User sign-in attempts                                      |

Login log filters: `search`, `accountId`, `status` (`success`/`failed`),
`from` and `to` (YYYY-MM-DD). `app_user` holds basic details only; other user
details go in their own tables keyed by `app_user.id`. A user needs an email
or a phone; changing one clears its verified flag unless the flag is sent too.

## Workspaces & projects API

User only. A workspace is an area of life or work (a new user starts with **Personal** and **Work**); projects live in one workspace. Names are unique per user (workspaces) and per workspace (projects). Every request checks the user may use the workspace or project through `workspaceService.canUseWorkspace` / `canUseProject`; other modules (tasks) call these too, so sharing later changes only them.

| Method | Path                                                      | Notes                                                                                                                                                 |
| ------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/workspaces`                                         | Oldest first, each with `openProjects` (not archived or completed).                                                                                   |
| POST   | `/api/workspaces`                                         | `{ name, color? }` (`#RRGGBB`). 409 `WORKSPACE_NAME_TAKEN`.                                                                                           |
| PATCH  | `/api/workspaces/:id`                                     | `name`, `color` (`null` clears).                                                                                                                      |
| DELETE | `/api/workspaces/:id`                                     | 409 `WORKSPACE_NOT_EMPTY` while it has projects or tasks; 409 `WORKSPACE_LAST` for the only one.                                                      |
| GET    | `/api/projects?workspaceId=&status=&includeArchived=true` | Archived last; then active, on hold, completed; then the nearest due date; then name. Each has `overdue`.                                             |
| POST   | `/api/projects`                                           | `{ workspaceId, name, description?, color?, status?, dueDate? }`; `status` is `active` (default), `on_hold` or `completed`. 409 `PROJECT_NAME_TAKEN`. |
| GET    | `/api/projects/:id`                                       |                                                                                                                                                       |
| PATCH  | `/api/projects/:id`                                       | Any field above (a new `workspaceId` moves it), and `isArchived`.                                                                                     |
| DELETE | `/api/projects/:id`                                       |                                                                                                                                                       |

## Categories & tags API

User only. Both are named, coloured labels a user keeps: a task has one **category** (Health, Home…) and any number of **tags** (urgent, waiting…). They share one table (`label`, with `kind`) and one implementation (`src/modules/label`: `LabelService` holds the rules, `label.kinds.ts` the words, error codes and suggested set of each kind). Names are unique per user and kind, so a category and a tag may share a name. Other modules check a label with `categoryService.canUse` / `tagService.canUse` before attaching it.

| Method                      | Path                                   | Notes                                                                                                    |
| --------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| GET                         | `/api/categories?includeArchived=true` | By name. Archived ones are left out unless asked for.                                                    |
| POST                        | `/api/categories`                      | `{ name, color? }` (`#RRGGBB`). 409 `CATEGORY_NAME_TAKEN`.                                               |
| POST                        | `/api/categories/suggested`            | Adds Home, Health, Finance, Learning, Errands and Family, skipping names the user has; returns the list. |
| PATCH                       | `/api/categories/:id`                  | `name`, `color` (`null` or `""` clears), `isArchived` (hidden from pickers).                             |
| DELETE                      | `/api/categories/:id`                  |                                                                                                          |
| GET / POST / PATCH / DELETE | `/api/tags…`                           | The same, with `TAG_NAME_TAKEN` / `TAG_NOT_FOUND`; no suggested set.                                     |

## Tasks API

User only. A top-level task sits in a **project** (and so in that project's workspace) or directly in a **workspace**; with neither given it goes to the user's first workspace. A **subtask** (`parentId`) goes with its task: one level only, and it cannot be moved on its own. Each task has `workspaceId` filled in, wherever it sits, so moving a project moves its tasks.

What happens elsewhere is handled by the database: deleting a project deletes its tasks; deleting a task deletes its subtasks; a deleted category leaves its tasks without one; a deleted tag comes off its tasks; a workspace with tasks cannot be deleted (409 `WORKSPACE_NOT_EMPTY`).

| Method | Path                                                                                                  | Notes                                                                                                                                                                                                                                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/tasks?page=&limit=&workspaceId=&projectId=&categoryId=&tagId=&status=&due=&q=&includeDone=true` | Top-level tasks, 50 a page: open first, then the nearest due date and time (none last), the highest priority, the oldest. `due` is `today`, `overdue`, `upcoming` (the next 7 days) or `none`, in the user's time zone. `q` searches title and notes. Done tasks are left out unless `includeDone` or `status=done`. |
| POST   | `/api/tasks`                                                                                          | `{ title, notes?, status?, priority?, dueDate?, dueTime?, remindAt?, projectId? \| workspaceId?, parentId?, categoryId?, tagIds? }`. Returns the task with `children`.                                                                                                                                               |
| GET    | `/api/tasks/:id`                                                                                      | With `children` (its subtasks).                                                                                                                                                                                                                                                                                      |
| PATCH  | `/api/tasks/:id`                                                                                      | Any field above except `parentId`. `projectId: null` takes it out of its project, into that project's workspace. Clearing `dueDate` clears `dueTime`.                                                                                                                                                                |
| DELETE | `/api/tasks/:id`                                                                                      | Its subtasks go too.                                                                                                                                                                                                                                                                                                 |

`status` is `todo`, `in_progress` or `done` (`completedAt` is set when it becomes done, cleared when reopened). `priority` is `none`, `low`, `medium` or `high` (stored as 0–3, so lists sort by it). `dueTime` is `HH:MM` in the user's time zone and needs a `dueDate`. `remindAt` is a local date and time (`YYYY-MM-DDTHH:MM`, as a datetime-local input sends it) for a reminder, or `null`. Each task has `overdue` (past its due date, or today past its due time, and not done) and `subtasks: { done, total }`.

## Notifications API

User only. There is no background job: listing notifications, or reading the unread count (which the app polls every minute), first asks every registered **source** what is new and adds it.

A module that wants to notify registers one source when it loads (`src/modules/notification/notification.sources.ts`); the notifications module never imports it:

```ts
registerNotificationSource({
  group: "reminders", // the on/off switch in settings
  candidates: async (userId, today) =>
    dueTasks.map((task) =>
      candidate(
        "task_due",
        { subjectType: "task", subjectId: task.id, title: task.title },
        { dueDate: task.dueDate },
        task.dueDate,
      ),
    ),
});
```

The tasks module registers two (`src/modules/task/task.reminders.ts`), both about open tasks and subtasks:

| Group       | Kind            | When                                                                                 | `data`                           |
| ----------- | --------------- | ------------------------------------------------------------------------------------ | -------------------------------- |
| `reminders` | `task_reminder` | Its `remindAt` has come (once per reminder time, so a moved reminder reminds again). | `remindAt`, `dueDate`, `dueTime` |
| `due_dates` | `task_due`      | It is due today (and, with a time, the time has not passed).                         | `dueDate`, `dueTime`             |
| `due_dates` | `task_overdue`  | Its due date has passed, or it was due today at a time now past. Once per due date.  | `dueDate`, `dueTime`             |

Each candidate has a dedupe key built from its kind, subject and occasion (e.g. `task_due:<task id>:<due date>`), so it is notified once, and again the next time it happens. Each notification has `kind`, `subjectType`, `subjectId`, `title` (the record's name then) and `data` (figures for the message); the app writes the sentence from these.

| Method    | Path                                          | Notes                                                                                                    |
| --------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| GET       | `/api/notifications?page=&limit=&unread=true` | Newest first, with `unreadCount`.                                                                        |
| GET       | `/api/notifications/unread-count`             | `{ unreadCount }`.                                                                                       |
| PATCH     | `/api/notifications/:id`                      | `{ "read": true }` or `false`.                                                                           |
| POST      | `/api/notifications/read-all`                 | `{ updated }`.                                                                                           |
| DELETE    | `/api/notifications/:id`                      | Hides it; it is kept so the same situation is not notified again.                                        |
| GET / PUT | `/api/notifications/settings`                 | `{ "muted": ["reminders"] }`: groups turned off stop getting new notifications. GET also lists `groups`. |

## System & audit API

Admin only.

| Method | Path                                                            | Permission                  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------ | --------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/system/overview`                                          | `system:read` (every role)  | Users (total, active, new and signed in over 30 days, sign-ups per month for 12 months), admins, how many records users keep (`usage`, a list of `{ key, count }` from `USAGE_TABLES` in `system.repository.ts`: a new module adds one line there), failed and successful sign-ins in the last 24 hours, and server health (database status and latency, size, migrations; API version, uptime, memory). Counts only: never anyone's content. |
| GET    | `/api/system/audit-log?page=&limit=&action=&adminId=&targetId=` | `audit:read` (super admins) | Every change admins made to admin and user accounts, newest first: who, when, from which IP, the account, and `details.changes` with each changed field's `from` and `to`. Passwords are never stored in it.                                                                                                                                                                                                                                  |

Actions: `admin.create`, `admin.update`, `admin.reset_password`, `user.create`, `user.update`, `user.reset_password`. The admin and user controllers record them after the change succeeds (`src/modules/audit`); updates that change nothing are not recorded.

### Sign-in limits

`/auth/*/login` allows 10 failed attempts (wrong password, no such account) per IP and account per 15 minutes; successful sign-ins never count. In production, `/auth/*/identify` and `/auth/*/login` also allow 100 requests per IP, and `/auth/user/register` 20 per IP; these per-IP limits are off by default elsewhere, since locally every request comes from 127.0.0.1. Past that the API answers `429 TOO_MANY_REQUESTS` ("Too many attempts. Try again in N minutes."). Change them with `AUTH_SIGN_IN_LIMIT`, `AUTH_SIGN_IN_IP_LIMIT` and `AUTH_REGISTER_LIMIT` (0 turns one off). Counts are kept in memory (`src/infrastructure/http/rate-limit.ts`), which suits one API server and reset on restart; with several servers, move them to a shared store such as Redis.

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
