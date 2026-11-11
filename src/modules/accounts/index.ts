// Building blocks shared by every kind of account (admin, user): secret
// tables, login log, sessions and their checks. Not an API module itself.

export { AccountSecrets } from "./account-secrets";
export { getSessionAccount, requireActiveAccount, withUniqueColumns } from "./account-session";
export {
  accountCreateBody,
  accountUpdateBody,
  assertAccountLoginChanges,
  assertNewAccountLogin,
  assertOptionalFlags,
  validateChangePassword,
  validateListQuery,
  validateLoginLogQuery,
  validateResetPassword,
} from "./account.validator";
export { LoginLogRepository } from "./login-log.repository";
export { PasswordRepository } from "./password.repository";
export { SessionRepository } from "./session.repository";
export { LOGIN_METHODS } from "./types/account.type";
export type {
  AccountDirectory,
  ClientInfo,
  IssuedSession,
  LoginAccount,
  LoginLog,
  LoginLogEntry,
  LoginMethod,
  SessionInfo,
} from "./types/account.type";
export type {
  ChangePasswordDto,
  LoginLogFilter,
  LoginLogListQuery,
  ResetPasswordDto,
} from "./dto/account.dto";
