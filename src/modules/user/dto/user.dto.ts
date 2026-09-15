// ── Request body DTOs ─────────────────────────────────────────────────────────

export interface CreateUserDto {
  name: string;
  email: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  isActive?: boolean;
}

// ── Request param / query interfaces ─────────────────────────────────────────

/** Route params that carry a single resource id, e.g. GET /users/:id */
export interface UserIdParams {
  id: string;
  [key: string]: string; // satisfies Express's ParamsDictionary index signature
}

/** Query params for paginated list endpoints, e.g. GET /users?page=1&limit=10 */
export interface UserListQuery {
  page?: string;
  limit?: string;
}
