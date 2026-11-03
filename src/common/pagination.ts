// List endpoints return `{ items, pagination }` inside `data`, matching the
// frontend's PaginatedData<T>.

export const MAX_PAGE_LIMIT = 100;

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

export interface PageRequest {
  page: number;
  limit: number;
}

export interface PageQuery {
  page?: string;
  limit?: string;
}

/** Read ?page= and ?limit= with safe bounds (page ≥ 1, 1 ≤ limit ≤ 100). */
export function parsePageQuery(query: PageQuery, defaultLimit = 10): PageRequest {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(
    MAX_PAGE_LIMIT,
    Math.max(1, parseInt(query.limit ?? String(defaultLimit), 10) || defaultLimit),
  );
  return { page, limit };
}

export function pageOffset({ page, limit }: PageRequest): number {
  return (page - 1) * limit;
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
