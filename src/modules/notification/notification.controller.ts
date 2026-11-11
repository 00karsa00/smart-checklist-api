import { currentUserId, parsePageQuery } from "../../common";
import { HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import {
  NotificationListQuery,
  UpdateNotificationDto,
  UpdateNotificationSettingsDto,
} from "./dto/notification.dto";
import { notificationService } from "./notification.service";

export function getNotifications(ctx: HttpContext<NoParams, NotificationListQuery>) {
  return notificationService.list(
    currentUserId(ctx),
    ctx.query.unread === "true",
    parsePageQuery(ctx.query, 20),
  );
}

export function getUnreadCount(ctx: HttpContext) {
  return notificationService.unreadCount(currentUserId(ctx));
}

export function markAllRead(ctx: HttpContext) {
  return notificationService.markAllRead(currentUserId(ctx));
}

export function updateNotification(ctx: HttpContext<IdParams, NoParams, UpdateNotificationDto>) {
  return notificationService.setRead(ctx.params.id, currentUserId(ctx), ctx.body.read);
}

export function deleteNotification(ctx: HttpContext<IdParams>) {
  return notificationService.delete(ctx.params.id, currentUserId(ctx));
}

export function getNotificationSettings(ctx: HttpContext) {
  return notificationService.getSettings(currentUserId(ctx));
}

export function updateNotificationSettings(
  ctx: HttpContext<NoParams, NoParams, UpdateNotificationSettingsDto>,
) {
  return notificationService.updateSettings(currentUserId(ctx), ctx.body);
}
