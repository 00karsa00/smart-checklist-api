import { authenticateAs } from "../../common";
import { ApiModule } from "../../infrastructure/http";

import { adminCan } from "../admin/admin.module";
import { getAuditLog, getOverview } from "./system.controller";
import { validateAuditQuery } from "./system.validator";

// For admins: the app as a whole (usage and health) and the audit log of account changes.
export const systemModule: ApiModule = {
  path: "/system",
  guards: [authenticateAs("admin")],
  routes: [
    {
      method: "get",
      path: "/overview",
      guards: [adminCan("system:read")],
      handler: getOverview,
    },
    {
      method: "get",
      path: "/audit-log",
      guards: [adminCan("audit:read"), validateAuditQuery],
      handler: getAuditLog,
    },
  ],
};
