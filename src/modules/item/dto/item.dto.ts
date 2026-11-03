import { PageQuery } from "../../../common/pagination";

// ── Request body DTOs ─────────────────────────────────────────────────────────
//
// `id` and `userId` are never accepted from the client: `id` is generated and
// `userId` comes from the signed-in user.

export interface CreateItemDto {
  name: string;
  description?: string | null;
}

export interface UpdateItemDto {
  name?: string;
  description?: string | null;
}

export interface ItemListQuery extends PageQuery {
  search?: string;
}
