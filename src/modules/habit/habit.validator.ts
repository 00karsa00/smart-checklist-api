import {
  assertOptional,
  assertOptionalBooleanQuery,
  assertOptionalColor,
  assertRequiredText,
  idParamGuard,
  isDate,
  isIntegerBetween,
  isUuid,
  normaliseOptionalText,
  orNull,
  rejectUnknownFields,
  updateGuard,
  validationError,
} from "../../common";
import { Guard } from "../../infrastructure/http";

type Body = Record<string, unknown>;

export const validateHabitIdParam = idParamGuard("Habit");

export const validateHabitDayParams: Guard = (ctx) => {
  validateHabitIdParam(ctx);
  if (!isDate(ctx.params.date)) throw validationError("The day must be a date (YYYY-MM-DD).");
};

const isTime = (value: unknown) =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const SCHEDULE =
  'Field \'schedule\' must be { kind: "daily" }, { kind: "weekdays", weekdays: [0–6, …] } or { kind: "weekly", timesPerWeek: 1–7 }.';

/** A schedule, checked and tidied (weekdays sorted, no repeats). */
function scheduleField(body: Body) {
  const value = body.schedule;
  if (value === undefined) return;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw validationError(SCHEDULE);
  }
  const schedule = value as Body;
  if (schedule.kind === "daily") {
    rejectUnknownFields(schedule, ["kind"], () => SCHEDULE);
  } else if (schedule.kind === "weekdays") {
    rejectUnknownFields(schedule, ["kind", "weekdays"], () => SCHEDULE);
    const days = schedule.weekdays;
    if (
      !Array.isArray(days) ||
      days.length === 0 ||
      !days.every((day) => isIntegerBetween(day, 0, 6))
    ) {
      throw validationError(SCHEDULE);
    }
    schedule.weekdays = [...new Set(days as number[])].sort((a, b) => a - b);
  } else if (schedule.kind === "weekly") {
    rejectUnknownFields(schedule, ["kind", "timesPerWeek"], () => SCHEDULE);
    if (!isIntegerBetween(schedule.timesPerWeek, 1, 7)) throw validationError(SCHEDULE);
  } else {
    throw validationError(SCHEDULE);
  }
}

function details(body: Body) {
  if (body.title !== undefined) assertRequiredText(body, "title", 200);
  normaliseOptionalText(body, "description", 1000);
  assertOptionalColor(body);
  assertOptional(body, "workspaceId", isUuid, "Field 'workspaceId' must be a workspace id.");
  scheduleField(body);
  if (body.reminderTime === "") body.reminderTime = null;
  assertOptional(
    body,
    "reminderTime",
    orNull(isTime),
    "Field 'reminderTime' must be a time (HH:MM) or null.",
  );
  assertOptional(body, "startDate", isDate, "Field 'startDate' must be a date (YYYY-MM-DD).");
}

const FIELDS = [
  "title",
  "description",
  "color",
  "workspaceId",
  "schedule",
  "reminderTime",
  "startDate",
];

export const validateCreateHabit: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(body, FIELDS, (field) => `Field '${field}' cannot be set here.`);
  assertRequiredText(body, "title", 200);
  if (body.schedule === undefined) throw validationError(SCHEDULE);
  details(body);
  ctx.body = body;
};

export const validateUpdateHabit = updateGuard(FIELDS, details, { archivable: true });

export const validateHabitListQuery: Guard = (ctx) => {
  const query = ctx.query as Body;
  rejectUnknownFields(
    query,
    ["includeArchived"],
    (field) => `Query param '${field}' is not supported.`,
  );
  assertOptionalBooleanQuery(query, "includeArchived");
};
