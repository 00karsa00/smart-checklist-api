// The single entry point for shared code. Modules import from here
// ("../../common"), never from a file inside this folder; ESLint enforces it.
// Add a new shared helper to its file below, then export it here.

// Errors
export { AppError } from "./errors/app.error";
export { ERROR_CODES } from "./errors/error.codes";
export type { ErrorCode } from "./errors/error.codes";

// Authentication
export { authenticate, currentUserId, requireValidToken } from "./guards/auth.guard";
export type { AuthenticatedUser } from "./types/authenticated-user.type";

// Response envelope
export { errorResponse, successResponse } from "./responses/api-response";
export type { ApiErrorResponse, ApiMeta, ApiSuccessResponse } from "./responses/api-response";

// Pagination
export { MAX_PAGE_LIMIT, buildPaginatedData, pageOffset, parsePageQuery } from "./pagination";
export type { PageQuery, PageRequest, PaginatedData, Pagination } from "./pagination";

// Validation
export {
  assertAtLeastOne,
  assertOptional,
  assertPageQuery,
  idParamGuard,
  isDate,
  isEmail,
  isNonEmptyString,
  isNonNegativeNumber,
  isOneOf,
  isPositiveNumber,
  isUuid,
  isUuidV4,
  orNull,
  rejectFields,
  validationError,
} from "./validation/rules";

// Utilities
export { assignDefined } from "./utils/assign-defined";
