# Personal Finance Backend

Express + Sequelize (PostgreSQL) API for the Personal Finance System.

## Getting started

```bash
npm install
npm run build          # compile TS -> dist (required before migrate/seed)
npm run db:migrate     # apply migrations
npm run db:seed        # seed sample data (users, then accounts)
npm run dev            # start dev server on :3001
```

The API is served under the `/api` prefix (see `configuration.app.apiPrefix`).

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

## Authentication

All resource endpoints require a JWT: `Authorization: Bearer <token>`.
Mint a token for local testing:

```bash
curl -X POST http://localhost:3001/api/auth/token \
  -H 'Content-Type: application/json' \
  -d '{ "userId": "<uuid>" }'
# -> { "data": { "accessToken": "…", "tokenType": "Bearer", "expiresIn": "7d" } }
```

The authenticated user is the **only** source of ownership. The client never
sends `user_id` / `userId`; it is taken from the verified token.

---

## Accounts API

Base path: `/api/accounts` — all routes require JWT auth.

| Method | Path                | Description                |
| ------ | ------------------- | -------------------------- |
| GET    | `/api/accounts`     | List the caller's accounts |
| GET    | `/api/accounts/:id` | Get one account (owned)    |
| POST   | `/api/accounts`     | Create an account          |
| PATCH  | `/api/accounts/:id` | Update an account (owned)  |
| DELETE | `/api/accounts/:id` | Soft-delete / deactivate   |

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

## Reusable CRUD structure

The Accounts module establishes the reusable per-module layout that later
modules (transactions, categories, budgets) follow:

```
src/modules/account/
├── account.routes.ts          # JWT + route wiring only
├── account.controller.ts      # HTTP in/out, reads req.user.userId
├── account.service.ts         # business rules, id generation, ownership
├── account.repository.ts      # Sequelize data access (scoped by userId)
├── account.validator.ts       # request validation middleware
├── account.id-generator.ts    # reusable ACC###### generator
├── dto/account.dto.ts         # request DTOs
└── types/account.type.ts      # domain type
```

Shared building blocks reused (not duplicated): `common/responses`
(`successResponse`, `buildPaginatedData`, `PaginatedData`), `common/errors`
(`AppError`, `ERROR_CODES`), `common/middleware/auth.middleware`, the shared
migration/seed system, and the config/logging infrastructure.
