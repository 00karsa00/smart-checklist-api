
export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiMeta | null;
  requestId: string | string[] | undefined;
}

// ── Reusable pagination ───────────────────────────────────────────────────────
//
// Paginated endpoints keep pagination *inside* `data` (as `{ items, pagination }`)
// so it is part of the API payload, matching the frontend's PaginatedData<T>.
// These helpers are generic and reused by every list endpoint.

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

export function buildPaginatedData<T>(
  items: T[],
  args: { page: number; limit: number; total: number },
): PaginatedData<T> {
  const { page, limit, total } = args;
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

export function successResponse<T>(
  data: T,
  requestId: string | string[] | undefined,
  meta: ApiMeta | null = null,
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    meta,
    requestId,
  };
}
