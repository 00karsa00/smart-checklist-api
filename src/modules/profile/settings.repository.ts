import { AppUserSettingsModel } from "../../infrastructure/database";

import { UserSettings } from "./types/profile.type";

function toSettings(row: AppUserSettingsModel): UserSettings {
  return {
    currency: row.currency,
    locale: row.locale,
    timeZone: row.timeZone,
    weekStartsOn: row.weekStartsOn,
  };
}

/** Data access for app_user_settings (one row per user). */
export class SettingsRepository {
  /** The user's saved settings, or null when they never changed any. */
  async find(userId: string): Promise<UserSettings | null> {
    const row = await AppUserSettingsModel.findOne({ where: { userId } });
    return row ? toSettings(row) : null;
  }

  /** Insert or replace the user's settings. */
  async save(userId: string, settings: UserSettings): Promise<UserSettings> {
    const [row] = await AppUserSettingsModel.upsert({ userId, ...settings });
    return toSettings(row);
  }
}

export const settingsRepository = new SettingsRepository();
