import {
  assertOptionalBooleanQuery,
  assertOptionalColor,
  assertRequiredText,
  rejectUnknownFields,
  updateGuard,
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

export const validateUpdateLabel = updateGuard(
  ["name", "color"],
  (body) => {
    if (body.name !== undefined) assertRequiredText(body, "name", 50);
    assertOptionalColor(body);
  },
  { archivable: true },
);
