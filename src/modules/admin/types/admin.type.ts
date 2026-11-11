import type { AdminPermission } from "../admin-roles";

/** Admin returned to API clients. Secrets never leave the admin module. */
export type AdminUser = {
  id: string;
  userName: string;
  /** How this admin signs in, e.g. "password". */
  loginMethod: string;
  /** One of ADMIN_ROLES (admin-roles.ts). */
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Public profile of the signed-in admin. */
export type AdminSession = Pick<AdminUser, "id" | "userName" | "loginMethod" | "role"> & {
  /** What this admin may do, so clients can hide what they cannot use. */
  permissions: readonly AdminPermission[];
};
