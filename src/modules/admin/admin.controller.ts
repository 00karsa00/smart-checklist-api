import { currentUserId, parsePageQuery } from "../../common";
import { HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import { LoginLogListQuery, ResetPasswordDto } from "../accounts";
import { changesBetween } from "../audit/audit.changes";
import { auditService } from "../audit/audit.service";
import { adminService } from "./admin.service";
import { AdminUserListQuery, CreateAdminUserDto, UpdateAdminUserDto } from "./dto/admin.dto";

export function getAdmins(ctx: HttpContext<NoParams, AdminUserListQuery>) {
  return adminService.listAdmins(parsePageQuery(ctx.query), ctx.query.search);
}

export function getAdmin(ctx: HttpContext<IdParams>) {
  return adminService.getAdminById(ctx.params.id);
}

/** Fields of an admin whose changes the audit log keeps. */
const AUDITED = ["userName", "loginMethod", "role", "isActive"] as const;
const target = (admin: { id: string; userName: string }) => ({
  type: "admin" as const,
  id: admin.id,
  label: admin.userName,
});

export async function createAdmin(ctx: HttpContext<NoParams, NoParams, CreateAdminUserDto>) {
  const admin = await adminService.createAdmin(ctx.body);
  await auditService.record(ctx, "admin.create", target(admin), {
    role: admin.role,
    isActive: admin.isActive,
    loginMethod: admin.loginMethod,
  });
  return admin;
}

export async function updateAdmin(ctx: HttpContext<IdParams, NoParams, UpdateAdminUserDto>) {
  const before = await adminService.getAdminById(ctx.params.id);
  const after = await adminService.updateAdmin(ctx.params.id, ctx.body, currentUserId(ctx));
  const changes = changesBetween(before, after, AUDITED);
  if (Object.keys(changes).length > 0) {
    await auditService.record(ctx, "admin.update", target(after), { changes });
  }
  return after;
}

export async function resetAdminPassword(ctx: HttpContext<IdParams, NoParams, ResetPasswordDto>) {
  const admin = await adminService.getAdminById(ctx.params.id);
  const result = await adminService.resetPassword(ctx.params.id, ctx.body.password);
  await auditService.record(ctx, "admin.reset_password", target(admin));
  return result;
}

export function getLoginLogs(ctx: HttpContext<NoParams, LoginLogListQuery>) {
  const { page: _page, limit: _limit, ...filter } = ctx.query;
  return adminService.secrets.listLoginLogs(parsePageQuery(ctx.query, 20), filter);
}
