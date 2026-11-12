import { ApiModule } from "../infrastructure/http";

import { adminModule } from "./admin/admin.module";
import { authModule } from "./auth/auth.module";
import { healthModule } from "./health/health.module";
import { itemModule } from "./item/item.module";
import { profileModule } from "./profile/profile.module";
import { userModule } from "./user/user.module";
import { notificationModule } from "./notification/notification.module";
import { systemModule } from "./system/system.module";
import { projectModule, workspaceModule } from "./workspace/workspace.module";
import { categoryModule, tagModule } from "./label/label.module";
import { taskModule } from "./task/task.module";
import { dashboardModule } from "./dashboard/dashboard.module";
import { searchModule } from "./search/search.module";
import { noteModule } from "./note/note.module";
import { goalModule } from "./goal/goal.module";
import { habitModule } from "./habit/habit.module";
import { timeModule } from "./time/time.module";

// Every feature the API serves. A new feature is one new line here.
export const modules: ApiModule[] = [
  healthModule,
  authModule,
  profileModule,
  adminModule,
  userModule,
  notificationModule,
  systemModule,
  workspaceModule,
  projectModule,
  categoryModule,
  tagModule,
  taskModule,
  dashboardModule,
  searchModule,
  noteModule,
  goalModule,
  habitModule,
  timeModule,
  itemModule,
];
