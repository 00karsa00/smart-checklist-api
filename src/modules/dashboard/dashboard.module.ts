import { currentUserId } from "../../common";
import { ApiModule, HttpContext } from "../../infrastructure/http";

import { userOnly } from "../user/user.module";
import { dashboardService } from "./dashboard.service";

// The Today page: what is overdue, due today and coming up, projects and progress.
export const dashboardModule: ApiModule = {
  path: "/dashboard",
  guards: userOnly,
  routes: [
    {
      method: "get",
      path: "/",
      handler: (ctx: HttpContext) => dashboardService.get(currentUserId(ctx)),
    },
  ],
};
