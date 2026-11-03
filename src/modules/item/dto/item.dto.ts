import { PageQuery } from "../../../common/pagination";

// ── Request body DTOs ─────────────────────────────────────────────────────────
//
// `id` and `userId` are never accepted from the client: `id` is generated and
// `userId` comes from the signed-in user.

export type CreateItemDto = {
  name: string;
  description?: string | null;
};

export type UpdateItemDto = {
  name?: string;
  description?: string | null;
};

export type ItemListQuery = {
  search?: string;
} & PageQuery;
