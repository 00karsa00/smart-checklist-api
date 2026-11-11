import {
  assertAtLeastOne,
  assertOptional,
  assertOptionalBooleanQuery,
  assertOptionalColor,
  assertRequiredText,
  isBoolean,
  rejectUnknownFields,
} from "../../common";
import { Guard } from "../../infrastructure/http";

type Body = Record<string, unknown>;

export const validateLabelListQuery: Guard = (ctx) => {
  const query = ctx.query as Body;
  rejectUnknownFields(
    query,
    ["includeArchived"],
    (field) => `Query param '${field}' is not supported.`,
  );
  assertOptionalBooleanQuery(query, "includeArchived");
};

export const validateCreateLabel: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(body, ["name", "color"], (field) => `Field '${field}' cannot be set here.`);
  assertRequiredText(body, "name", 50);
  assertOptionalColor(body);
  ctx.body = body;
};

export const validateUpdateLabel: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  const fields = ["name", "color", "isArchived"];
  rejectUnknownFields(body, fields, (field) => `Field '${field}' cannot be changed.`);
  assertAtLeastOne(body, fields);
  if (body.name !== undefined) assertRequiredText(body, "name", 50);
  assertOptionalColor(body);
  assertOptional(body, "isArchived", isBoolean, "Field 'isArchived' must be true or false.");
  ctx.body = body;
};
