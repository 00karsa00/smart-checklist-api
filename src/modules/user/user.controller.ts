import { Request, Response, NextFunction } from "express";

import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";

import { CreateUserDto, UpdateUserDto, UserIdParams, UserListQuery } from "./dto/user.dto";
import { User } from "./types/user.type";
import { userRepository } from "./user.repository";

// ══════════════════════════════════════════════════════════════════════════════
// Common API response structure
// ══════════════════════════════════════════════════════════════════════════════
//
// Every API responds with the same top-level envelope:
//
//   {
//     success: boolean;
//     data?: <endpoint specific payload>;   // generic / dynamic per API
//     error?: { code; message };            // common shape for every API
//     meta: { ... };                        // common shape (requestId, etc.)
//   }
//
// For paginated endpoints the pagination info lives *inside* `data`, because it
// is part of the API response data (see PaginatedData / Pagination below).

/** Common error object, shared by every API response. */
interface ApiError {
  code: string | number;
  message: string;
}

/** Common meta object, shared by every API response. */
interface ApiMeta {
  requestId?: string | string[];
  [key: string]: unknown;
}

/** The single response envelope used by every API. `data` is generic. */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta: ApiMeta;
}

/** Common pagination block, reused by every paginated endpoint. */
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Common shape for paginated `data`. Pagination is kept inside `data` because
 * it is part of the API response data, not transport-level meta.
 */
interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

// ── Response helpers ────────────────────────────────────────────────────────

/** Build a successful response envelope with a consistent structure. */
function successResponse<T>(data: T, meta: ApiMeta = {}): ApiResponse<T> {
  return { success: true, data, meta };
}

/** Build the common paginated `data` block. */
function buildPaginatedData<T>(
  items: T[],
  { page, limit, total }: { page: number; limit: number; total: number },
): PaginatedData<T> {
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

/** Extract the common `meta` block from the incoming request. */
function buildMeta(req: Request): ApiMeta {
  return { requestId: req.headers["x-request-id"] };
}

// ══════════════════════════════════════════════════════════════════════════════
// User service (pure business logic)
// ══════════════════════════════════════════════════════════════════════════════
//
// Design rules:
//  - Every method takes a single plain payload object.
//  - No knowledge of HTTP, Express, auth, or request context lives here.
//  - Methods return plain business data (entities / paginated data), never the
//    transport-level ApiResponse envelope.
//
// This keeps the service easy to unit test, reuse, and replace.

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

interface ListUsersPayload {
  page?: number;
  limit?: number;
}

class UserService {
  async listUsers(payload: ListUsersPayload = {}): Promise<PaginatedData<User>> {
    const page = payload.page ?? DEFAULT_PAGE;
    const limit = payload.limit ?? DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    const { rows, count } = await userRepository.findAll(offset, limit);

    return buildPaginatedData(rows, { page, limit, total: count });
  }

  async getUserById(payload: { id: string }): Promise<User> {
    const user = await userRepository.findById(payload.id);

    if (!user) {
      throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, "User not found");
    }

    return user;
  }

  async createUser(payload: CreateUserDto): Promise<User> {
    const existingUser = await userRepository.findByEmail(payload.email);

    if (existingUser) {
      throw new AppError(
        409,
        ERROR_CODES.USER_ALREADY_EXISTS,
        "User with this email already exists",
      );
    }

    return userRepository.create(payload);
  }

  async updateUser(payload: { id: string; data: UpdateUserDto }): Promise<User> {
    const { id, data } = payload;

    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, "User not found");
    }

    if (data.email) {
      const existingUser = await userRepository.findByEmail(data.email);

      if (existingUser && existingUser.id !== id) {
        throw new AppError(
          409,
          ERROR_CODES.USER_ALREADY_EXISTS,
          "User with this email already exists",
        );
      }
    }

    return (await userRepository.update(id, data)) as User;
  }

  async deleteUser(payload: { id: string }): Promise<null> {
    const user = await userRepository.findById(payload.id);

    if (!user) {
      throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, "User not found");
    }

    await userRepository.delete(payload.id);
    return null;
  }
}

const userService = new UserService();

// ══════════════════════════════════════════════════════════════════════════════
// Controllers
// ══════════════════════════════════════════════════════════════════════════════
//
// Controllers own the HTTP layer: they parse/validate transport input, call the
// service with a plain payload object (no auth / request data), and wrap the
// pure business result in the common ApiResponse envelope.

export async function getUsers(
  req: Request<
    Record<string, never>,
    ApiResponse<PaginatedData<User>>,
    Record<string, never>,
    UserListQuery & { [key: string]: string | undefined }
  >,
  res: Response<ApiResponse<PaginatedData<User>>>,
  next: NextFunction,
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "10", 10) || 10));

    const data = await userService.listUsers({ page, limit });

    res.status(200).json(successResponse(data, buildMeta(req)));
  } catch (error) {
    next(error);
  }
}

export async function getUser(
  req: Request<UserIdParams>,
  res: Response<ApiResponse<User>>,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await userService.getUserById({ id: req.params.id });

    res.status(200).json(successResponse(data, buildMeta(req)));
  } catch (error) {
    next(error);
  }
}

export async function createUser(
  req: Request<Record<string, never>, ApiResponse<User>, CreateUserDto>,
  res: Response<ApiResponse<User>>,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await userService.createUser(req.body);

    res.status(201).json(successResponse(data, buildMeta(req)));
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req: Request<UserIdParams, ApiResponse<User>, UpdateUserDto>,
  res: Response<ApiResponse<User>>,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await userService.updateUser({ id: req.params.id, data: req.body });

    res.status(200).json(successResponse(data, buildMeta(req)));
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(
  req: Request<UserIdParams>,
  res: Response<ApiResponse<null>>,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await userService.deleteUser({ id: req.params.id });

    res.status(200).json(successResponse(data, buildMeta(req)));
  } catch (error) {
    next(error);
  }
}
