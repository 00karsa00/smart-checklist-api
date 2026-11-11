import {
  assertOptionalBooleanQuery,
  assertPageQuery,
  idParamGuard,
  isBoolean,
  isOneOf,
  rejectUnknownFields,
  validationError,
} from "../../common";
import { Guard } from "../../infrastructure/http";

import { notificationGroups } from "./notification.sources";

type Body = Record<string, unknown>;
const unknownField = (field: string) => `Field '${field}' cannot be set here.`;

export const validateNotificationIdParam = idParamGuard("Notification");

export const validateNotificationListQuery: Guard = (ctx) => {
  const query = ctx.query as Body & { page?: string; limit?: string };
  rejectUnknownFields(
    query,
    ["page", "limit", "unread"],
    (field) => `Query param '${field}' is not supported.`,
  );
  assertPageQuery(query);
  assertOptionalBooleanQuery(query, "unread");
};

export const validateUpdateNotification: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(body, ["read"], unknownField);
  if (!isBoolean(body.read)) throw validationError("Field 'read' must be true or false.");
};

export const validateNotificationSettings: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(body, ["muted"], unknownField);
  const { muted } = body;
  const groups = notificationGroups();
  if (!Array.isArray(muted) || !muted.every((group) => isOneOf(group, groups))) {
    throw validationError(`Field 'muted' must be a list of: ${groups.join(", ") || "(none yet)"}.`);
  }
};
