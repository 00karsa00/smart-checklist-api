import {
  assertAtLeastOne,
  assertOptional,
  assertOptionalColor,
  assertRequiredText,
  idParamGuard,
  isBoolean,
  isDate,
  isOneOf,
  isUuid,
  normaliseOptionalText,
  orNull,
  rejectUnknownFields,
  validationError,
} from "../../common";
import { Guard } from "../../infrastructure/http";

import { GOAL_STATUSES } from "./types/goal.type";

type Body = Record<string, unknown>;
const MAX_MILESTONES = 50;
const MAX_PROJECTS = 20;

export const validateGoalIdParam = idParamGuard("Goal");

export const validateMilestoneParams: Guard = (ctx) => {
  validateGoalIdParam(ctx);
  if (!isUuid(ctx.params.milestoneId)) throw validationError("Milestone id must be a valid UUID.");
};

const dueDate = (body: Body, field: string) => {
  if (body[field] === "") body[field] = null;
  assertOptional(
    body,
    field,
    orNull(isDate),
    `Field '${field}' must be a date (YYYY-MM-DD) or null.`,
  );
};

function details(body: Body) {
  if (body.title !== undefined) assertRequiredText(body, "title", 200);
  normaliseOptionalText(body, "description", 2000);
  assertOptionalColor(body);
  assertOptional(body, "workspaceId", isUuid, "Field 'workspaceId' must be a workspace id.");
  dueDate(body, "targetDate");
  const { projectIds } = body;
  if (projectIds !== undefined) {
    if (
      !Array.isArray(projectIds) ||
      projectIds.length > MAX_PROJECTS ||
      !projectIds.every(isUuid)
    ) {
      throw validationError(
        `Field 'projectIds' must be a list of up to ${MAX_PROJECTS} project ids.`,
      );
    }
    body.projectIds = [...new Set(projectIds)];
  }
}

const FIELDS = ["title", "description", "color", "workspaceId", "targetDate", "projectIds"];

export const validateCreateGoal: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(
    body,
    [...FIELDS, "milestones"],
    (field) => `Field '${field}' cannot be set here.`,
  );
  assertRequiredText(body, "title", 200);
  details(body);
  const { milestones } = body;
  if (milestones !== undefined) {
    if (!Array.isArray(milestones) || milestones.length > MAX_MILESTONES) {
      throw validationError(`Field 'milestones' must be a list of up to ${MAX_MILESTONES} titles.`);
    }
    body.milestones = milestones.map((title) => {
      if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
        throw validationError("Each milestone must be 1 to 200 characters.");
      }
      return title.trim();
    });
  }
  ctx.body = body;
};

export const validateUpdateGoal: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  const fields = [...FIELDS, "status"];
  rejectUnknownFields(body, fields, (field) => `Field '${field}' cannot be changed.`);
  assertAtLeastOne(body, fields);
  details(body);
  assertOptional(
    body,
    "status",
    (value) => isOneOf(value, GOAL_STATUSES),
    `Field 'status' must be one of: ${GOAL_STATUSES.join(", ")}.`,
  );
  ctx.body = body;
};

export const validateCreateMilestone: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(
    body,
    ["title", "dueDate"],
    (field) => `Field '${field}' cannot be set here.`,
  );
  assertRequiredText(body, "title", 200);
  dueDate(body, "dueDate");
  ctx.body = body;
};

export const validateUpdateMilestone: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  const fields = ["title", "dueDate", "done"];
  rejectUnknownFields(body, fields, (field) => `Field '${field}' cannot be changed.`);
  assertAtLeastOne(body, fields);
  if (body.title !== undefined) assertRequiredText(body, "title", 200);
  dueDate(body, "dueDate");
  assertOptional(body, "done", isBoolean, "Field 'done' must be true or false.");
  ctx.body = body;
};

export const validateGoalListQuery: Guard = (ctx) => {
  const query = ctx.query as Body;
  rejectUnknownFields(
    query,
    ["status", "workspaceId"],
    (field) => `Query param '${field}' is not supported.`,
  );
  assertOptional(
    query,
    "status",
    (value) => isOneOf(value, GOAL_STATUSES),
    `Query param 'status' must be one of: ${GOAL_STATUSES.join(", ")}.`,
  );
  assertOptional(query, "workspaceId", isUuid, "Query param 'workspaceId' must be a workspace id.");
};
