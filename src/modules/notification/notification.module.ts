import { ApiModule } from "../../infrastructure/http";

import { userOnly } from "../user/user.module";
import {
  deleteNotification,
  getNotifications,
  getNotificationSettings,
  getUnreadCount,
  markAllRead,
  updateNotification,
  updateNotificationSettings,
} from "./notification.controller";
import {
  validateNotificationIdParam,
  validateNotificationListQuery,
  validateNotificationSettings,
  validateUpdateNotification,
} from "./notification.validator";

// In-app notifications made by registered sources (see notification.sources.ts),
// with read state and one on/off switch per source.
export const notificationModule: ApiModule = {
  path: "/notifications",
  guards: userOnly,
  routes: [
    {
      method: "get",
      path: "/",
      guards: [validateNotificationListQuery],
      handler: getNotifications,
    },
    { method: "get", path: "/unread-count", handler: getUnreadCount },
    { method: "post", path: "/read-all", handler: markAllRead },
    { method: "get", path: "/settings", handler: getNotificationSettings },
    {
      method: "put",
      path: "/settings",
      guards: [validateNotificationSettings],
      handler: updateNotificationSettings,
    },
    {
      method: "patch",
      path: "/:id",
      guards: [validateNotificationIdParam, validateUpdateNotification],
      handler: updateNotification,
    },
    {
      method: "delete",
      path: "/:id",
      guards: [validateNotificationIdParam],
      handler: deleteNotification,
    },
  ],
};
