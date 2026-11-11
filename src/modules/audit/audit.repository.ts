import { AdminAuditLogModel } from "../../infrastructure/database";

import { AuditEntry, AuditFilter } from "./types/audit.type";

function toEntry(row: AdminAuditLogModel): AuditEntry {
  return {
    id: row.id,
    adminId: row.adminId,
    adminUserName: row.adminUserName,
    action: row.action as AuditEntry["action"],
    targetType: row.targetType as AuditEntry["targetType"],
    targetId: row.targetId,
    targetLabel: row.targetLabel,
    details: row.details,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  };
}

/** The admin audit log: written once, never changed. */
export class AuditRepository {
  async add(entry: Omit<AuditEntry, "id" | "createdAt">): Promise<void> {
    await AdminAuditLogModel.create(entry);
  }

  async findPage(
    filter: AuditFilter,
    offset: number,
    limit: number,
  ): Promise<{ rows: AuditEntry[]; count: number }> {
    const where = Object.fromEntries(
      Object.entries(filter).filter(([, value]) => value !== undefined),
    );
    const { rows, count } = await AdminAuditLogModel.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });
    return { rows: rows.map(toEntry), count };
  }
}

export const auditRepository = new AuditRepository();
