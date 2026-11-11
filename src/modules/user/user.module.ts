import { authenticateAs } from "../../common";
import { ApiModule } from "../../infrastructure/http";

import {
  requireActiveAccount,
  validateListQuery,
  validateLoginLogQuery,
  validateResetPassword,
} from "../accounts";
import { adminCan } from "../admin/admin.module";
import {
  createUser,
  getUser,
  getUserLoginLogs,
  getUsers,
  resetUserPassword,
  updateUser,
} from "./user.controller";
import { userService } from "./user.service";
import { validateCreateUser, validateUpdateUser, validateUserIdParam } from "./user.validator";

/** Guards for routes only an active app user may use (their own data). */
export const userOnly = requireActiveAccount(userService);

const canRead = adminCan("users:read");
const canWrite = adminCan("users:write");

// App users, managed by admins (per their role's permissions). Users sign in through /auth/user/*.
export const userModule: ApiModule = {
  path: "/users",
  guards: [authenticateAs("admin")],
  routes: [
    { method: "get", path: "/", guards: [canRead, validateListQuery], handler: getUsers },
    {
      method: "post",
      path: "/",
      guards: [canWrite, validateCreateUser],
      status: 201,
      handler: createUser,
    },
    {
      method: "get",
      path: "/login-logs",
      guards: [canRead, validateLoginLogQuery],
      handler: getUserLoginLogs,
    },
    { method: "get", path: "/:id", guards: [canRead, validateUserIdParam], handler: getUser },
    {
      method: "patch",
      path: "/:id",
      guards: [canWrite, validateUserIdParam, validateUpdateUser],
      handler: updateUser,
    },
    {
      method: "post",
      path: "/:id/reset-password",
      guards: [canWrite, validateUserIdParam, validateResetPassword],
      handler: resetUserPassword,
    },
  ],
};
