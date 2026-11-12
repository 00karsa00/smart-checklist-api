import {
  assertAtLeastOne,
  assertOptional,
  assertOptionalBooleanQuery,
  assertPageQuery,
  assertRequiredText,
  idParamGuard,
  isBoolean,
  isUuid,
  normaliseOptionalText,
  orNull,
  rejectUnknownFields,
  updateGuard,
  validationError,
} from "../../common";
import { Guard } from "../../infrastructure/http";

type Body = Record<string, unknown>;
const MAX_ITEMS = 100;

export const validateNoteIdParam = idParamGuard("Note");

export const validateNoteItemParams: Guard = (ctx) => {
  validateNoteIdParam(ctx);
  if (!isUuid(ctx.params.itemId)) throw validationError("Item id must be a valid UUID.");
};

/** Every field a create or update may carry, apart from the first items. */
function details(body: Body) {
  if (body.title !== undefined) assertRequiredText(body, "title", 200);
  normaliseOptionalText(body, "body", 20000);
  for (const field of ["projectId", "taskId"]) if (body[field] === "") body[field] = null;
  assertOptional(
    body,
    "projectId",
    orNull(isUuid),
    "Field 'projectId' must be a project id or null.",
  );
  assertOptional(body, "workspaceId", isUuid, "Field 'workspaceId' must be a workspace id.");
  assertOptional(body, "taskId", orNull(isUuid), "Field 'taskId' must be a task id or null.");
  assertOptional(body, "isPinned", isBoolean, "Field 'isPinned' must be true or false.");
  if (body.projectId && body.workspaceId) {
    throw validationError(
      "Send a projectId or a workspaceId, not both: a project has its workspace.",
    );
  }
}

const FIELDS = ["title", "body", "projectId", "workspaceId", "taskId", "isPinned"];

export const validateCreateNote: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(
    body,
    [...FIELDS, "items"],
    (field) => `Field '${field}' cannot be set here.`,
  );
  assertRequiredText(body, "title", 200);
  details(body);
  const { items } = body;
  if (items !== undefined) {
    if (!Array.isArray(items) || items.length > MAX_ITEMS) {
      throw validationError(`Field 'items' must be a list of up to ${MAX_ITEMS} texts.`);
    }
    body.items = items.map((text) => {
      if (typeof text !== "string" || !text.trim() || text.trim().length > 500) {
        throw validationError("Each checklist item must be 1 to 500 characters.");
      }
      return text.trim();
    });
  }
  ctx.body = body;
};

export const validateUpdateNote = updateGuard(FIELDS, details, { archivable: true });

export const validateCreateNoteItem: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(body, ["text"], (field) => `Field '${field}' cannot be set here.`);
  assertRequiredText(body, "text", 500);
  ctx.body = body;
};

export const validateUpdateNoteItem: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(body, ["text", "isDone"], (field) => `Field '${field}' cannot be changed.`);
  assertAtLeastOne(body, ["text", "isDone"]);
  if (body.text !== undefined) assertRequiredText(body, "text", 500);
  assertOptional(body, "isDone", isBoolean, "Field 'isDone' must be true or false.");
  ctx.body = body;
};

export const validateNoteListQuery: Guard = (ctx) => {
  const query = ctx.query as Body & { page?: string; limit?: string };
  rejectUnknownFields(
    query,
    ["page", "limit", "workspaceId", "projectId", "taskId", "q", "includeArchived"],
    (field) => `Query param '${field}' is not supported.`,
  );
  assertPageQuery(query);
  for (const field of ["workspaceId", "projectId", "taskId"]) {
    assertOptional(query, field, isUuid, `Query param '${field}' must be an id.`);
  }
  assertOptional(
    query,
    "q",
    (value) => typeof value === "string" && value.length <= 100,
    "Query param 'q' must be at most 100 characters.",
  );
  assertOptionalBooleanQuery(query, "includeArchived");
};
