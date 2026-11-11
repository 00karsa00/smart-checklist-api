import {
  buildPaginatedData,
  currentUserId,
  pageOffset,
  PageRequest,
  PaginatedData,
} from "../../common";
import { AnyHttpContext } from "../../infrastructure/http";
import { logger } from "../../infrastructure/logger";

import { adminService, AdminService } from "../admin/admin.service";
import { auditRepository, AuditRepository } from "./audit.repository";
import { AuditAction, AuditEntry, AuditFilter } from "./types/audit.type";

export type AuditTarget = { type: AuditEntry["targetType"]; id: string; label: string };

/**
 * Records what admins change in accounts, for the audit log. Called by the
 * admin and user controllers after a change succeeds.
 */
export class AuditService {
  constructor(
    private readonly entries: AuditRepository = auditRepository,
    private readonly admins: AdminService = adminService,
  ) {}

  /**
   * Record a change made by the signed-in admin. A failure to record is
   * logged, never thrown: the change itself has already been made.
   */
  async record(
    ctx: AnyHttpContext,
    action: AuditAction,
    target: AuditTarget,
    details: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      const adminId = currentUserId(ctx);
      const admin = await this.admins.getAdminById(adminId);
      await this.entries.add({
        adminId,
        adminUserName: admin.userName,
        action,
        targetType: target.type,
        targetId: target.id,
        targetLabel: target.label,
        details,
        ipAddress: ctx.ip ?? null,
      });
    } catch (error) {
      logger.error("Could not write the audit log", { action, error: String(error) });
    }
  }

  async list(filter: AuditFilter, page: PageRequest): Promise<PaginatedData<AuditEntry>> {
    const { rows, count } = await this.entries.findPage(filter, pageOffset(page), page.limit);
    return buildPaginatedData(rows, { ...page, total: count });
  }
}

export const auditService = new AuditService();
