import {
  assertAtLeastOne,
  assertOptional,
  assertPageQuery,
  idParamGuard,
  isNonEmptyString,
  orNull,
  rejectFields,
  validationError,
} from "../../common/validation/rules";
import { Guard } from "../../infrastructure/http";

const MAX_NAME_LENGTH = 100;

function assertName(name: string): void {
  if (name.trim().length > MAX_NAME_LENGTH) {
    throw validationError(`Field 'name' must not exceed ${MAX_NAME_LENGTH} characters.`);
  }
}

export const validateItemIdParam = idParamGuard("Item");

export const validateItemListQuery: Guard = (ctx) => {
  assertPageQuery(ctx.query);
};

export const validateCreateItem: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Record<string, unknown>;

  rejectFields(body, ["id", "userId"], (field) => `Field '${field}' cannot be set by the client.`);

  if (!isNonEmptyString(body.name)) {
    throw validationError("Field 'name' is required and must be a non-empty string.");
  }
  assertName(body.name);

  assertOptional(
    body,
    "description",
    orNull(isNonEmptyString),
    "Field 'description' must be a non-empty string or null.",
  );
};

export const validateUpdateItem: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Record<string, unknown>;

  rejectFields(
    body,
    ["id", "userId"],
    (field) => `Field '${field}' cannot be updated through this endpoint.`,
  );
  assertAtLeastOne(body, ["name", "description"]);

  assertOptional(body, "name", isNonEmptyString, "Field 'name' must be a non-empty string.");
  if (typeof body.name === "string") assertName(body.name);

  assertOptional(
    body,
    "description",
    orNull(isNonEmptyString),
    "Field 'description' must be a non-empty string or null.",
  );
};
