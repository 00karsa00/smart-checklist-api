export const AUDIT_ACTIONS = [
  "admin.create",
  "admin.update",
  "admin.reset_password",
  "user.create",
  "user.update",
  "user.reset_password",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** A field's value before and after a change. */
export type FieldChange = { from: unknown; to: unknown };

export type AuditEntry = {
  id: string;
  /** The admin who did it; null if that admin has since been removed. */
  adminId: string | null;
  /** Their user name at the time. */
  adminUserName: string;
  action: AuditAction;
  targetType: "admin" | "user";
  targetId: string;
  /** The account's user name, email or name at the time. */
  targetLabel: string;
  /** For updates: { changes: { field: { from, to } } }; for creation: the starting role and state. */
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: Date;
};

/** GET /system/audit-log filters. */
export type AuditFilter = { action?: AuditAction; adminId?: string; targetId?: string };
