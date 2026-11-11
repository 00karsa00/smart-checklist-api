import { AppError, authenticateAs, currentUserId, ERROR_CODES } from "../../common";
import { ApiModule, Guard } from "../../infrastructure/http";

import {
  getSessionAccount,
  requireActiveAccount,
  validateListQuery,
  validateLoginLogQuery,
  validateResetPassword,
} from "../accounts";
import {
  createAdmin,
  getAdmin,
  getAdmins,
  getLoginLogs,
  resetAdminPassword,
  updateAdmin,
} from "./admin.controller";
import { AdminPermission, permissionsOf } from "./admin-roles";
import { adminService } from "./admin.service";
import { validateAdminIdParam, validateCreateAdmin, validateUpdateAdmin } from "./admin.validator";

/** Guards for routes any active admin may use, whatever their role (e.g. own password). */
export const adminOnly = requireActiveAccount(adminService);

/**
 * Route guard for a module behind `authenticateAs("admin")`: the admin must
 * still be active and their role must grant `permission` (403 otherwise).
 */
export function adminCan(permission: AdminPermission): Guard {
  return async (ctx) => {
    const admin = await getSessionAccount(adminService, currentUserId(ctx));
    if (!permissionsOf(admin.role).includes(permission)) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, "You do not have permission to do this.");
    }
  };
}

const canRead = adminCan("admins:read");
const canWrite = adminCan("admins:write");

export const adminModule: ApiModule = {
  path: "/admin",
  guards: [authenticateAs("admin")],
  routes: [
    { method: "get", path: "/users", guards: [canRead, validateListQuery], handler: getAdmins },
    {
      method: "post",
      path: "/users",
      guards: [canWrite, validateCreateAdmin],
      status: 201,
      handler: createAdmin,
    },
    {
      method: "get",
      path: "/users/:id",
      guards: [canRead, validateAdminIdParam],
      handler: getAdmin,
    },
    {
      method: "patch",
      path: "/users/:id",
      guards: [canWrite, validateAdminIdParam, validateUpdateAdmin],
      handler: updateAdmin,
    },
    {
      method: "post",
      path: "/users/:id/reset-password",
      guards: [canWrite, validateAdminIdParam, validateResetPassword],
      handler: resetAdminPassword,
    },
    {
      method: "get",
      path: "/login-logs",
      guards: [canRead, validateLoginLogQuery],
      handler: getLoginLogs,
    },
  ],
};
