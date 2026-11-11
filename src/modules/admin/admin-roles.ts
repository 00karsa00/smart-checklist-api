// What admins may do. Routes check a permission, never a role name, so a new
// role is one entry in ROLE_PERMISSIONS and a new permission one in PERMISSIONS.

export const ADMIN_PERMISSIONS = [
  /** See admin users and their login log. */
  "admins:read",
  /** Create and change admin users, reset their passwords. */
  "admins:write",
  /** See app users and their login log. */
  "users:read",
  /** Create and change app users, reset their passwords. */
  "users:write",
  /** See the system overview: usage counts (never anyone's content) and server health. */
  "system:read",
  /** See the audit log of changes admins made to accounts. */
  "audit:read",
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ROLE_PERMISSIONS = {
  super_admin: ADMIN_PERMISSIONS,
  admin: ["users:read", "users:write", "system:read"],
  viewer: ["users:read", "system:read"],
} as const satisfies Record<string, readonly AdminPermission[]>;

export type AdminRole = keyof typeof ROLE_PERMISSIONS;
export const ADMIN_ROLES = Object.keys(ROLE_PERMISSIONS) as AdminRole[];
export const DEFAULT_ADMIN_ROLE: AdminRole = "admin";

/** The permissions of a role; none for a role this version does not know. */
export function permissionsOf(role: string): readonly AdminPermission[] {
  return ROLE_PERMISSIONS[role as AdminRole] ?? [];
}
