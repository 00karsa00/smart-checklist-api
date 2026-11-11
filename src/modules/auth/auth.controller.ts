import { AnyHttpContext, HttpContext, NoParams } from "../../infrastructure/http";
import { currentUserId } from "../../common";

import { adminService } from "../admin/admin.service";
import { userService } from "../user/user.service";
import {
  AdminIdentifyDto,
  AdminLoginDto,
  LoginClient,
  RefreshTokenDto,
  UserIdentifyDto,
  UserLoginDto,
  ValidateTokenDto,
} from "./dto/auth.dto";
import { RegisterUserDto } from "../user/dto/user.dto";
import { authService } from "./auth.service";

function clientOf(ctx: AnyHttpContext): LoginClient {
  return { ipAddress: ctx.ip || null, userAgent: ctx.header("user-agent") ?? null };
}

// ── Admins ──────────────────────────────────────────────────────────────────

export async function identifyAdmin(ctx: HttpContext<NoParams, NoParams, AdminIdentifyDto>) {
  const { userName } = ctx.body;
  return { userName, ...(await authService.identify(adminService, userName)) };
}

export function loginAdmin(ctx: HttpContext<NoParams, NoParams, AdminLoginDto>) {
  return authService.login(adminService, ctx.body.userName, ctx.body, clientOf(ctx));
}

export function refreshAdmin(ctx: HttpContext<NoParams, NoParams, RefreshTokenDto>) {
  return authService.refresh(adminService, ctx.body.refreshToken, clientOf(ctx));
}

export function logoutAdmin(ctx: HttpContext<NoParams, NoParams, RefreshTokenDto>) {
  return authService.logout(adminService, ctx.body.refreshToken);
}

export function adminMe(ctx: HttpContext) {
  return authService.me(adminService, currentUserId(ctx));
}

// ── Users ───────────────────────────────────────────────────────────────────

export async function identifyUser(ctx: HttpContext<NoParams, NoParams, UserIdentifyDto>) {
  const { identifier } = ctx.body;
  return { identifier, ...(await authService.identify(userService, identifier)) };
}

export function loginUser(ctx: HttpContext<NoParams, NoParams, UserLoginDto>) {
  return authService.login(userService, ctx.body.identifier, ctx.body, clientOf(ctx));
}

export function registerUser(ctx: HttpContext<NoParams, NoParams, RegisterUserDto>) {
  return authService.register(userService, ctx.body, clientOf(ctx));
}

export function refreshUser(ctx: HttpContext<NoParams, NoParams, RefreshTokenDto>) {
  return authService.refresh(userService, ctx.body.refreshToken, clientOf(ctx));
}

export function logoutUser(ctx: HttpContext<NoParams, NoParams, RefreshTokenDto>) {
  return authService.logout(userService, ctx.body.refreshToken);
}

export function userMe(ctx: HttpContext) {
  return authService.me(userService, currentUserId(ctx));
}

export function validateToken(ctx: HttpContext<NoParams, NoParams, ValidateTokenDto>) {
  return authService.validateToken(ctx.body);
}
