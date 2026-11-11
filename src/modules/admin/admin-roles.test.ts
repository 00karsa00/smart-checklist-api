import { describe, expect, it } from "vitest";

import { ADMIN_PERMISSIONS, ADMIN_ROLES, permissionsOf } from "./admin-roles";

describe("admin roles", () => {
  it("gives a super admin every permission", () => {
    expect(permissionsOf("super_admin")).toEqual(ADMIN_PERMISSIONS);
  });

  it("lets an admin manage users and see the system, but not admins or the audit log", () => {
    expect(permissionsOf("admin")).toEqual(["users:read", "users:write", "system:read"]);
  });

  it("lets a viewer only read users and the system overview", () => {
    expect(permissionsOf("viewer")).toEqual(["users:read", "system:read"]);
  });

  it("grants nothing to an unknown role", () => {
    expect(permissionsOf("root")).toEqual([]);
  });

  it("lists every role", () => {
    expect(ADMIN_ROLES).toEqual(["super_admin", "admin", "viewer"]);
  });
});
