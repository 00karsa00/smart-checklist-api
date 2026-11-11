import { parsePageQuery } from "../../common";
import { HttpContext, NoParams } from "../../infrastructure/http";

import { auditService } from "../audit/audit.service";
import { AuditFilter } from "../audit/types/audit.type";
import { systemService } from "./system.service";

export function getOverview() {
  return systemService.overview();
}

export function getAuditLog(
  ctx: HttpContext<NoParams, AuditFilter & { page?: string; limit?: string }>,
) {
  const { page: _page, limit: _limit, ...filter } = ctx.query;
  return auditService.list(filter, parsePageQuery(ctx.query, 20));
}
