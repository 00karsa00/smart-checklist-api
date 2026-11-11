import {
  assertAtLeastOne,
  assertOptional,
  assertOptionalBooleanQuery,
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

import { PROJECT_STATUSES } from "./types/workspace.type";

type Body = Record<string, unknown>;
const cannotSet = (field: string) => `Field '${field}' cannot be set here.`;
const cannotChange = (field: string) => `Field '${field}' cannot be changed.`;
const STATUS = `Field 'status' must be one of: ${PROJECT_STATUSES.join(", ")}.`;

export const validateWorkspaceIdParam = idParamGuard("Workspace");
export const validateProjectIdParam = idParamGuard("Project");

export const validateCreateWorkspace: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(body, ["name", "color"], cannotSet);
  assertRequiredText(body, "name", 60);
  assertOptionalColor(body);
  ctx.body = body;
};

export const validateUpdateWorkspace: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  const fields = ["name", "color"];
  rejectUnknownFields(body, fields, cannotChange);
  assertAtLeastOne(body, fields);
  if (body.name !== undefined) assertRequiredText(body, "name", 60);
  assertOptionalColor(body);
  ctx.body = body;
};

/** description, color, status and dueDate (all optional). */
function projectDetails(body: Body) {
  normaliseOptionalText(body, "description", 1000);
  assertOptionalColor(body);
  assertOptional(body, "status", (value) => isOneOf(value, PROJECT_STATUSES), STATUS);
  if (body.dueDate === "") body.dueDate = null;
  assertOptional(
    body,
    "dueDate",
    orNull(isDate),
    "Field 'dueDate' must be a date (YYYY-MM-DD) or null.",
  );
}

const WORKSPACE_ID = "Field 'workspaceId' must be a workspace id.";

export const validateCreateProject: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(
    body,
    ["workspaceId", "name", "description", "color", "status", "dueDate"],
    cannotSet,
  );
  if (!isUuid(body.workspaceId)) throw validationError(WORKSPACE_ID);
  assertRequiredText(body, "name", 100);
  projectDetails(body);
  ctx.body = body;
};

export const validateUpdateProject: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  const fields = ["workspaceId", "name", "description", "color", "status", "dueDate", "isArchived"];
  rejectUnknownFields(body, fields, cannotChange);
  assertAtLeastOne(body, fields);
  assertOptional(body, "workspaceId", isUuid, WORKSPACE_ID);
  if (body.name !== undefined) assertRequiredText(body, "name", 100);
  projectDetails(body);
  assertOptional(body, "isArchived", isBoolean, "Field 'isArchived' must be true or false.");
  ctx.body = body;
};

export const validateProjectListQuery: Guard = (ctx) => {
  const query = ctx.query as Body;
  rejectUnknownFields(
    query,
    ["workspaceId", "status", "includeArchived"],
    (field) => `Query param '${field}' is not supported.`,
  );
  assertOptional(query, "workspaceId", isUuid, "Query param 'workspaceId' must be a workspace id.");
  assertOptional(
    query,
    "status",
    (value) => isOneOf(value, PROJECT_STATUSES),
    `Query param 'status' must be one of: ${PROJECT_STATUSES.join(", ")}.`,
  );
  assertOptionalBooleanQuery(query, "includeArchived");
};
