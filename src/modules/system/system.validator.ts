import {
  assertPageQuery,
  isOneOf,
  isUuid,
  rejectUnknownFields,
  validationError,
} from "../../common";
import { Guard } from "../../infrastructure/http";

import { AUDIT_ACTIONS } from "../audit/types/audit.type";

export const validateAuditQuery: Guard = (ctx) => {
  const query = ctx.query as Record<string, string | undefined>;
  rejectUnknownFields(
    query,
    ["page", "limit", "action", "adminId", "targetId"],
    (field) => `Query param '${field}' is not supported.`,
  );
  assertPageQuery(query);
  if (query.action !== undefined && !isOneOf(query.action, AUDIT_ACTIONS)) {
    throw validationError(`Query param 'action' must be one of: ${AUDIT_ACTIONS.join(", ")}.`);
  }
  for (const field of ["adminId", "targetId"]) {
    if (query[field] !== undefined && !isUuid(query[field])) {
      throw validationError(`Query param '${field}' must be an id.`);
    }
  }
};
