import {
  assertAtLeastOne,
  assertOptional,
  assertOptionalBooleanQuery,
  assertPageQuery,
  assertRequiredText,
  idParamGuard,
  isDate,
  isIntegerBetween,
  isOneOf,
  isUuid,
  normaliseOptionalText,
  orNull,
  rejectUnknownFields,
  validationError,
} from "../../common";
import { Guard } from "../../infrastructure/http";

import { REPEAT_FREQUENCIES } from "./task.repeat";
import { DUE_FILTERS, TASK_PRIORITIES, TASK_STATUSES } from "./types/task.type";

type Body = Record<string, unknown>;
const MAX_TAGS = 20;

export const validateTaskIdParam = idParamGuard("Task");

const isTime = (value: unknown) =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
/** "YYYY-MM-DDTHH:MM", as a datetime-local input sends it. */
const isLocalDateTime = (value: unknown) =>
  typeof value === "string" &&
  value.length === 16 &&
  value[10] === "T" &&
  isDate(value.slice(0, 10)) &&
  isTime(value.slice(11));
const oneOf = (field: string, allowed: readonly string[]) =>
  [
    (value: unknown) => isOneOf(value, allowed),
    `Field '${field}' must be one of: ${allowed.join(", ")}.`,
  ] as const;

const REPEAT_MESSAGE =
  "Field 'repeat' must be null or { frequency: daily | weekly | monthly | yearly, interval?: 1–99, weekdays?: [0–6] (weekly only) }.";

/** A repeat rule, or null; `interval` defaults to 1 and weekdays are sorted. */
function repeatField(body: Body) {
  const value = body.repeat;
  if (value === undefined || value === null) return;
  if (typeof value !== "object" || Array.isArray(value)) throw validationError(REPEAT_MESSAGE);
  const rule = value as Body;
  rejectUnknownFields(rule, ["frequency", "interval", "weekdays"], () => REPEAT_MESSAGE);
  rule.interval ??= 1;
  const weekdays = rule.weekdays;
  const weekdaysOk =
    weekdays === undefined ||
    (rule.frequency === "weekly" &&
      Array.isArray(weekdays) &&
      weekdays.length > 0 &&
      weekdays.every((day) => isIntegerBetween(day, 0, 6)));
  if (
    !isOneOf(rule.frequency, REPEAT_FREQUENCIES) ||
    !isIntegerBetween(rule.interval, 1, 99) ||
    !weekdaysOk
  ) {
    throw validationError(REPEAT_MESSAGE);
  }
  if (weekdays) rule.weekdays = [...new Set(weekdays as number[])].sort((a, b) => a - b);
}

/** Every field a create or update may carry, apart from where the task goes. */
function details(body: Body) {
  if (body.title !== undefined) assertRequiredText(body, "title", 200);
  normaliseOptionalText(body, "notes", 5000);
  assertOptional(body, "status", ...oneOf("status", TASK_STATUSES));
  assertOptional(body, "priority", ...oneOf("priority", TASK_PRIORITIES));
  for (const field of ["dueDate", "dueTime", "remindAt", "categoryId", "projectId"]) {
    if (body[field] === "") body[field] = null;
  }
  assertOptional(
    body,
    "dueDate",
    orNull(isDate),
    "Field 'dueDate' must be a date (YYYY-MM-DD) or null.",
  );
  assertOptional(
    body,
    "dueTime",
    orNull(isTime),
    "Field 'dueTime' must be a time (HH:MM) or null.",
  );
  assertOptional(
    body,
    "remindAt",
    orNull(isLocalDateTime),
    "Field 'remindAt' must be a local date and time (YYYY-MM-DDTHH:MM) or null.",
  );
  assertOptional(
    body,
    "categoryId",
    orNull(isUuid),
    "Field 'categoryId' must be a category id or null.",
  );
  assertOptional(
    body,
    "projectId",
    orNull(isUuid),
    "Field 'projectId' must be a project id or null.",
  );
  assertOptional(body, "workspaceId", isUuid, "Field 'workspaceId' must be a workspace id.");
  assertOptional(
    body,
    "tagIds",
    (value) => Array.isArray(value) && value.length <= MAX_TAGS && value.every(isUuid),
    `Field 'tagIds' must be a list of up to ${MAX_TAGS} tag ids.`,
  );
  // The same tag twice is the same tag.
  if (Array.isArray(body.tagIds)) body.tagIds = [...new Set(body.tagIds)];
  repeatField(body);
  if (body.projectId && body.workspaceId) {
    throw validationError(
      "Send a projectId or a workspaceId, not both: a project has its workspace.",
    );
  }
}

const FIELDS = [
  "title",
  "notes",
  "status",
  "priority",
  "dueDate",
  "dueTime",
  "remindAt",
  "repeat",
  "projectId",
  "workspaceId",
  "categoryId",
  "tagIds",
];

export const validateCreateTask: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(
    body,
    [...FIELDS, "parentId"],
    (field) => `Field '${field}' cannot be set here.`,
  );
  assertRequiredText(body, "title", 200);
  details(body);
  assertOptional(body, "parentId", isUuid, "Field 'parentId' must be a task id.");
  if (body.dueTime && !body.dueDate) throw validationError("Field 'dueTime' needs a due date.");
  ctx.body = body;
};

export const validateUpdateTask: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(body, FIELDS, (field) =>
    field === "parentId"
      ? "Field 'parentId' cannot be changed."
      : `Field '${field}' cannot be changed.`,
  );
  assertAtLeastOne(body, FIELDS);
  details(body);
  ctx.body = body;
};

export const validateTaskListQuery: Guard = (ctx) => {
  const query = ctx.query as Body & { page?: string; limit?: string };
  rejectUnknownFields(
    query,
    [
      "page",
      "limit",
      "workspaceId",
      "projectId",
      "categoryId",
      "tagId",
      "status",
      "due",
      "from",
      "to",
      "q",
      "includeDone",
    ],
    (field) => `Query param '${field}' is not supported.`,
  );
  assertPageQuery(query);
  for (const field of ["workspaceId", "projectId", "categoryId", "tagId"]) {
    assertOptional(query, field, isUuid, `Query param '${field}' must be an id.`);
  }
  assertOptional(
    query,
    "status",
    (value) => isOneOf(value, TASK_STATUSES),
    `Query param 'status' must be one of: ${TASK_STATUSES.join(", ")}.`,
  );
  assertOptional(
    query,
    "due",
    (value) => isOneOf(value, DUE_FILTERS),
    `Query param 'due' must be one of: ${DUE_FILTERS.join(", ")}.`,
  );
  for (const field of ["from", "to"]) {
    assertOptional(query, field, isDate, `Query param '${field}' must be a date (YYYY-MM-DD).`);
  }
  if (query.due && (query.from || query.to)) {
    throw validationError("Use either 'due' or 'from' / 'to', not both.");
  }
  if (query.from && query.to && (query.from as string) > (query.to as string)) {
    throw validationError("Query param 'from' must not be after 'to'.");
  }
  assertOptional(
    query,
    "q",
    (value) => typeof value === "string" && value.length <= 100,
    "Query param 'q' must be at most 100 characters.",
  );
  assertOptionalBooleanQuery(query, "includeDone");
};
