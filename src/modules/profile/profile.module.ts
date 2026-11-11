import { ApiModule, Guard, Route } from "../../infrastructure/http";

import { validateChangePassword } from "../accounts";
import { adminOnly } from "../admin/admin.module";
import { userOnly } from "../user/user.module";
import { validateUpdateOwnProfile } from "../user/user.validator";
import {
  adminSecurity,
  getUserSettings,
  updateUserProfile,
  updateUserSettings,
  userSecurity,
} from "./profile.controller";
import { validateSessionIdParam, validateUpdateSettings } from "./profile.validator";

/** Password and signed-in device routes under `/<kind>`, for one kind of account. */
function securityRoutes(kind: string, guards: Guard[], handlers: typeof userSecurity): Route[] {
  return [
    {
      method: "post",
      path: `/${kind}/password`,
      guards: [...guards, validateChangePassword],
      handler: handlers.changePassword,
    },
    { method: "get", path: `/${kind}/sessions`, guards, handler: handlers.listSessions },
    {
      method: "post",
      path: `/${kind}/sessions/sign-out-others`,
      guards,
      handler: handlers.endOtherSessions,
    },
    {
      method: "delete",
      path: `/${kind}/sessions/:id`,
      guards: [...guards, validateSessionIdParam],
      handler: handlers.endSession,
    },
  ];
}

// The signed-in account managing itself. Reading the profile stays at
// GET /auth/<kind>/me; admins change admins' details through /admin/users.
export const profileModule: ApiModule = {
  path: "/profile",
  routes: [
    {
      method: "patch",
      path: "/user",
      guards: [...userOnly, validateUpdateOwnProfile],
      handler: updateUserProfile,
    },
    { method: "get", path: "/user/settings", guards: userOnly, handler: getUserSettings },
    {
      method: "patch",
      path: "/user/settings",
      guards: [...userOnly, validateUpdateSettings],
      handler: updateUserSettings,
    },
    ...securityRoutes("user", userOnly, userSecurity),
    ...securityRoutes("admin", adminOnly, adminSecurity),
  ],
};
