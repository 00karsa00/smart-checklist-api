import { PageQuery } from "../../../common";

export type ResetPasswordDto = {
  password: string;
};

/** An account holder changing their own password. */
export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

export type LoginLogListQuery = {
  /** Part of the identifier (user name, email or phone). */
  search?: string;
  accountId?: string;
  status?: "success" | "failed";
  /** YYYY-MM-DD, inclusive. */
  from?: string;
  to?: string;
} & PageQuery;

export type LoginLogFilter = Omit<LoginLogListQuery, "page" | "limit">;
