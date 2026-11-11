import { parsePageQuery } from "../../common";
import { HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import { LoginLogListQuery, ResetPasswordDto } from "../accounts";
import { changesBetween } from "../audit/audit.changes";
import { auditService } from "../audit/audit.service";
import { CreateUserDto, UpdateUserDto, UserListQuery } from "./dto/user.dto";
import { AppUser } from "./types/user.type";
import { userService } from "./user.service";

export function getUsers(ctx: HttpContext<NoParams, UserListQuery>) {
  return userService.listUsers(parsePageQuery(ctx.query), ctx.query.search);
}

export function getUser(ctx: HttpContext<IdParams>) {
  return userService.getUserById(ctx.params.id);
}

/** Fields of a user whose changes the audit log keeps. */
const AUDITED = [
  "name",
  "email",
  "phone",
  "loginMethod",
  "isActive",
  "isEmailVerified",
  "isPhoneVerified",
] as const;
const target = (user: AppUser) => ({
  type: "user" as const,
  id: user.id,
  label: user.email ?? user.phone ?? user.name,
});

export async function createUser(ctx: HttpContext<NoParams, NoParams, CreateUserDto>) {
  const user = await userService.createUser(ctx.body);
  await auditService.record(ctx, "user.create", target(user), {
    isActive: user.isActive,
    loginMethod: user.loginMethod,
  });
  return user;
}

export async function updateUser(ctx: HttpContext<IdParams, NoParams, UpdateUserDto>) {
  const before = await userService.getUserById(ctx.params.id);
  const after = await userService.updateUser(ctx.params.id, ctx.body);
  const changes = changesBetween(before, after, AUDITED);
  if (Object.keys(changes).length > 0) {
    await auditService.record(ctx, "user.update", target(after), { changes });
  }
  return after;
}

export async function resetUserPassword(ctx: HttpContext<IdParams, NoParams, ResetPasswordDto>) {
  const user = await userService.getUserById(ctx.params.id);
  const result = await userService.resetPassword(ctx.params.id, ctx.body.password);
  await auditService.record(ctx, "user.reset_password", target(user));
  return result;
}

export function getUserLoginLogs(ctx: HttpContext<NoParams, LoginLogListQuery>) {
  const { page: _page, limit: _limit, ...filter } = ctx.query;
  return userService.secrets.listLoginLogs(parsePageQuery(ctx.query, 20), filter);
}
