import { currentSessionId, currentUserId } from "../../common";
import { AnyHttpContext, HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import { AccountDirectory, ChangePasswordDto } from "../accounts";
import { adminService } from "../admin/admin.service";
import { userService } from "../user/user.service";
import { UpdateProfileDto, UpdateSettingsDto } from "./dto/profile.dto";
import { profileService } from "./profile.service";

// ── User only ───────────────────────────────────────────────────────────────

export function updateUserProfile(ctx: HttpContext<NoParams, NoParams, UpdateProfileDto>) {
  return profileService.updateUserProfile(currentUserId(ctx), ctx.body);
}

export function getUserSettings(ctx: HttpContext) {
  return profileService.getSettings(currentUserId(ctx));
}

export function updateUserSettings(ctx: HttpContext<NoParams, NoParams, UpdateSettingsDto>) {
  return profileService.updateSettings(currentUserId(ctx), ctx.body);
}

// ── Security, for each kind of account ──────────────────────────────────────

/** The password and device handlers for one kind of account. */
function securityHandlers(directory: AccountDirectory) {
  return {
    changePassword: (ctx: HttpContext<NoParams, NoParams, ChangePasswordDto>) =>
      profileService.changePassword(directory, currentUserId(ctx), ctx.body, currentSessionId(ctx)),
    listSessions: (ctx: AnyHttpContext) =>
      profileService.listSessions(directory, currentUserId(ctx), currentSessionId(ctx)),
    endSession: (ctx: HttpContext<IdParams>) =>
      profileService.endSession(directory, currentUserId(ctx), ctx.params.id),
    endOtherSessions: (ctx: AnyHttpContext) =>
      profileService.endOtherSessions(directory, currentUserId(ctx), currentSessionId(ctx)),
  };
}

export const userSecurity = securityHandlers(userService);
export const adminSecurity = securityHandlers(adminService);
