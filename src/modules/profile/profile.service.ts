import { assignDefined, timeIn, todayIn } from "../../common";
import { configuration } from "../../config/configuration";

import { AccountDirectory, ChangePasswordDto, SessionInfo } from "../accounts";
import { UserSession } from "../user/types/user.type";
import { userService, UserService } from "../user/user.service";
import { UpdateProfileDto, UpdateSettingsDto } from "./dto/profile.dto";
import { settingsRepository, SettingsRepository } from "./settings.repository";
import { UserSettings } from "./types/profile.type";

const PROFILE_FIELDS = ["name", "email", "phone"] as const;
const SETTINGS_FIELDS = ["currency", "locale", "timeZone", "weekStartsOn"] as const;

/**
 * The signed-in account managing itself: profile, settings, password and
 * signed-in devices. Account rules (unique email, a user keeps an email or
 * phone, verified flags) stay in the account's own service.
 */
export class ProfileService {
  constructor(
    private readonly users: UserService = userService,
    private readonly settings: SettingsRepository = settingsRepository,
  ) {}

  // ── Profile ───────────────────────────────────────────────────────────────

  /** Update the signed-in user's name, email or phone; returns the new session profile. */
  async updateUserProfile(userId: string, data: UpdateProfileDto): Promise<UserSession> {
    const changes: UpdateProfileDto = {};
    assignDefined(changes, data, PROFILE_FIELDS);
    return this.users.toSession(await this.users.updateUser(userId, changes));
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  /** The user's settings; the defaults until they change any. */
  async getSettings(userId: string): Promise<UserSettings> {
    return (await this.settings.find(userId)) ?? { ...configuration.userDefaults };
  }

  /** Today's date (YYYY-MM-DD) in the user's time zone. */
  async today(userId: string): Promise<string> {
    return todayIn((await this.getSettings(userId)).timeZone);
  }

  /** The user's local date and time now: { date: "YYYY-MM-DD", time: "HH:MM" }. */
  async now(userId: string): Promise<{ date: string; time: string }> {
    const { timeZone } = await this.getSettings(userId);
    const now = new Date();
    return { date: todayIn(timeZone, now), time: timeIn(timeZone, now) };
  }

  /** Change some settings; the others keep their current value. */
  async updateSettings(userId: string, data: UpdateSettingsDto): Promise<UserSettings> {
    const next = await this.getSettings(userId);
    assignDefined(next, data, SETTINGS_FIELDS);
    return this.settings.save(userId, next);
  }

  // ── Security ──────────────────────────────────────────────────────────────

  /** Any kind of account changing its own password. Its other sessions end; this one stays. */
  async changePassword(
    directory: AccountDirectory,
    accountId: string,
    data: ChangePasswordDto,
    sessionId?: string,
  ): Promise<null> {
    await directory.secrets.changePassword(
      accountId,
      data.currentPassword,
      data.newPassword,
      sessionId,
    );
    return null;
  }

  /** Where this account is signed in. */
  listSessions(
    directory: AccountDirectory,
    accountId: string,
    sessionId?: string,
  ): Promise<SessionInfo[]> {
    return directory.secrets.listSessions(accountId, sessionId);
  }

  /** Sign one device out. */
  async endSession(
    directory: AccountDirectory,
    accountId: string,
    targetSessionId: string,
  ): Promise<null> {
    await directory.secrets.endSessionById(accountId, targetSessionId);
    return null;
  }

  /** Sign every device out except this one. */
  async endOtherSessions(
    directory: AccountDirectory,
    accountId: string,
    sessionId?: string,
  ): Promise<null> {
    await directory.secrets.endAllSessions(accountId, sessionId);
    return null;
  }
}

export const profileService = new ProfileService();
