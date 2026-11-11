// The single entry point for shared code. Modules import from here
// ("../../common"), never from a file inside this folder; ESLint enforces it.
// Add a new shared helper to its file below, then export it here.

// Errors
export { AppError } from "./errors/app.error";
export { ERROR_CODES } from "./errors/error.codes";
export type { ErrorCode } from "./errors/error.codes";

// Authentication
export {
  authenticate,
  authenticateAs,
  currentSessionId,
  currentUserId,
  requireValidToken,
} from "./guards/auth.guard";
export { ACCOUNT_KINDS } from "./types/authenticated-user.type";
export type { AccountKind, AuthenticatedUser } from "./types/authenticated-user.type";

// Response envelope
export { errorResponse, successResponse } from "./responses/api-response";
export type { ApiErrorResponse, ApiMeta, ApiSuccessResponse } from "./responses/api-response";

// Pagination
export { MAX_PAGE_LIMIT, buildPaginatedData, pageOffset, parsePageQuery } from "./pagination";
export type { PageQuery, PageRequest, PaginatedData, Pagination } from "./pagination";

// Validation
export {
  assertAtLeastOne,
  assertOptionalBooleanQuery,
  assertOptionalColor,
  assertOptional,
  assertPageQuery,
  assertRequiredText,
  idParamGuard,
  isBoolean,
  isDate,
  isCurrencyCode,
  isEmail,
  isHexColor,
  isIntegerBetween,
  isLocaleTag,
  isNonEmptyString,
  isNonNegativeNumber,
  isOneOf,
  isPositiveNumber,
  isTimeZone,
  isUuid,
  isUuidV4,
  normaliseOptionalText,
  orNull,
  rejectFields,
  rejectUnknownFields,
  validationError,
} from "./validation/rules";

// Utilities
export { assignDefined } from "./utils/assign-defined";
export { addDays, addMonths, daysBetween, financialMonth, todayIn } from "./utils/dates";
export type { DatePeriod } from "./utils/dates";
export { parseCsv, parseCsvLines, toCsv } from "./utils/csv";
export { currencyDigits, minorToPlain, toMinorUnits } from "./utils/money";
export type { CsvRow, CsvValue } from "./utils/csv";
export { DETECTABLE_FILE_TYPES, detectFileType } from "./utils/file-type";
