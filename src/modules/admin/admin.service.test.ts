import { describe, expect, it } from "vitest";

import { ERROR_CODES } from "../../common";
import { CLIENT, fakeSecrets } from "../../test-support/fakes";
import { AdminRepository } from "./admin.repository";
import { AdminService } from "./admin.service";
import { AdminUser } from "./types/admin.type";

function setup(role = "super_admin") {
  const admin: AdminUser = {
    id: "admin-1",
    userName: "asha",
    loginMethod: "password",
    role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const repo = {
    findById: async (id: string) => (id === admin.id ? admin : null),
    update: async (_id: string, changes: Partial<AdminUser>) => Object.assign(admin, changes),
  } as unknown as AdminRepository;
  const fakes = fakeSecrets();
  return { service: new AdminService(repo, fakes.secrets), admin, fakes };
}

describe("AdminService.updateAdmin", () => {
  it("refuses changing your own role", async () => {
    const { service, admin } = setup();
    await expect(service.updateAdmin(admin.id, { role: "viewer" }, admin.id)).rejects.toMatchObject(
      { code: ERROR_CODES.ADMIN_CANNOT_CHANGE_OWN_ROLE },
    );
  });

  it("allows saving your own unchanged role", async () => {
    const { service, admin } = setup();
    await expect(
      service.updateAdmin(admin.id, { role: "super_admin" }, admin.id),
    ).resolves.toMatchObject({ role: "super_admin" });
  });

  it("changes another admin's role", async () => {
    const { service, admin } = setup("viewer");
    await expect(
      service.updateAdmin(admin.id, { role: "admin" }, "someone-else"),
    ).resolves.toMatchObject({ role: "admin" });
  });

  it("signs a deactivated admin out everywhere", async () => {
    const { service, admin, fakes } = setup();
    const session = await fakes.secrets.startSession(admin.id, CLIENT);

    await service.updateAdmin(admin.id, { isActive: false }, "someone-else");

    await expect(fakes.secrets.rotateSession(session.refreshToken, CLIENT)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("puts role and permissions in the session profile", () => {
    const { service, admin } = setup("viewer");
    expect(service.toSession(admin)).toEqual({
      id: admin.id,
      userName: "asha",
      loginMethod: "password",
      role: "viewer",
      permissions: ["users:read", "system:read"],
    });
  });
});
