import { PageQuery } from "../../../common";

import { LoginMethod } from "../../accounts";
import type { AdminRole } from "../admin-roles";

// `userName` is normalised (trimmed, lower-case) by the validator.

export type CreateAdminUserDto = {
  userName: string;
  loginMethod: LoginMethod;
  /** Required when loginMethod is "password". */
  password?: string;
  /** Defaults to "admin". */
  role?: AdminRole;
  isActive?: boolean;
};

export type UpdateAdminUserDto = {
  userName?: string;
  loginMethod?: LoginMethod;
  role?: AdminRole;
  isActive?: boolean;
};

export type AdminUserListQuery = {
  search?: string;
} & PageQuery;
