import {
  assertOptional,
  isDate,
  isIntegerBetween,
  isOneOf,
  isUuid,
  orNull,
  rejectUnknownFields,
  updateGuard,
  validationError,
} from "../../common";
import { Guard } from "../../infrastructure/http";

import { TIME_KINDS } from "./types/time.type";

type Body = Record<string, unknown>;
const MAX_RANGE_DAYS = 62;

const isMoment = (value: unknown) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T/.test(value) &&
  !Number.isNaN(Date.parse(value));
const MOMENT = (field: string) => `Field '${field}' must be a date and time (ISO 8601).`;

/** taskId and description: what the time is for. */
function about(body: Body) {
  if (body.taskId === "") body.taskId = null;
  assertOptional(body, "taskId", orNull(isUuid), "Field 'taskId' must be a task id or null.");
  if (typeof body.description === "string") body.description = body.description.trim();
  assertOptional(
    body,
    "description",
    (value) => typeof value === "string" && value.length >= 1 && value.length <= 200,
    "Field 'description' must be 1 to 200 characters.",
  );
}

export const validateStartTimer: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(
    body,
    ["taskId", "description", "kind", "plannedMinutes"],
    (field) => `Field '${field}' cannot be set here.`,
  );
  about(body);
  assertOptional(
    body,
    "kind",
    (value) => isOneOf(value, TIME_KINDS),
    `Field 'kind' must be one of: ${TIME_KINDS.join(", ")}.`,
  );
  assertOptional(
    body,
    "plannedMinutes",
    orNull((value) => isIntegerBetween(value, 1, 240)),
    "Field 'plannedMinutes' must be 1 to 240 minutes.",
  );
  ctx.body = body;
};

export const validateLogTime: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(
    body,
    ["taskId", "description", "startedAt", "endedAt"],
    (field) => `Field '${field}' cannot be set here.`,
  );
  about(body);
  for (const field of ["startedAt", "endedAt"]) {
    if (!isMoment(body[field])) throw validationError(MOMENT(field));
  }
  ctx.body = body;
};

export const validateUpdateTimeEntry = updateGuard(
  ["taskId", "description", "startedAt", "endedAt"],
  (body) => {
    about(body);
    for (const field of ["startedAt", "endedAt"])
      assertOptional(body, field, isMoment, MOMENT(field));
  },
);

/** ?from=&to= local days, at most two months apart. */
export const validateTimeRange: Guard = (ctx) => {
  const query = ctx.query as Body;
  rejectUnknownFields(query, ["from", "to"], (field) => `Query param '${field}' is not supported.`);
  if (!isDate(query.from) || !isDate(query.to)) {
    throw validationError("Query params 'from' and 'to' must be dates (YYYY-MM-DD).");
  }
  const days = (Date.parse(query.to as string) - Date.parse(query.from as string)) / 86_400_000;
  if (days < 0 || days > MAX_RANGE_DAYS) {
    throw validationError(
      `'from' must be on or before 'to', at most ${MAX_RANGE_DAYS} days apart.`,
    );
  }
};

export const validateTimesheetQuery: Guard = (ctx) => {
  const query = ctx.query as Body;
  rejectUnknownFields(query, ["date"], (field) => `Query param '${field}' is not supported.`);
  assertOptional(query, "date", isDate, "Query param 'date' must be a date (YYYY-MM-DD).");
};
