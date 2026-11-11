import { AppError, buildPaginatedData, ERROR_CODES, pageOffset, PageRequest } from "../../common";

import { profileService, ProfileService } from "../profile/profile.service";
import { notificationGroups, notificationSources } from "./notification.sources";
import { notificationRepository, NotificationRepository } from "./notification.repository";
import {
  Notification,
  NotificationList,
  NotificationSettings,
  NotificationSettingsView,
  NotificationSource,
} from "./types/notification.type";

/**
 * In-app notifications. There is no background job: each read first asks every
 * registered source (see notification.sources.ts) what is new, so the list is
 * up to date whenever the user looks (the app polls the unread count).
 */
export class NotificationService {
  constructor(
    private readonly notifications: NotificationRepository = notificationRepository,
    private readonly profiles: ProfileService = profileService,
    private readonly sources: () => readonly NotificationSource[] = notificationSources,
  ) {}

  async list(userId: string, unreadOnly: boolean, page: PageRequest): Promise<NotificationList> {
    await this.refresh(userId);
    const [{ rows, count }, unreadCount] = await Promise.all([
      this.notifications.findPage(userId, unreadOnly, pageOffset(page), page.limit),
      this.notifications.unreadCount(userId),
    ]);
    return { ...buildPaginatedData(rows, { ...page, total: count }), unreadCount };
  }

  async unreadCount(userId: string): Promise<{ unreadCount: number }> {
    await this.refresh(userId);
    return { unreadCount: await this.notifications.unreadCount(userId) };
  }

  async setRead(id: string, userId: string, read: boolean): Promise<Notification> {
    await this.get(id, userId);
    await this.notifications.setRead(id, userId, read);
    return this.get(id, userId);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    return { updated: await this.notifications.markAllRead(userId) };
  }

  async delete(id: string, userId: string): Promise<null> {
    await this.get(id, userId);
    await this.notifications.dismiss(id, userId);
    return null;
  }

  async getSettings(userId: string): Promise<NotificationSettingsView> {
    return { muted: await this.notifications.mutedGroups(userId), groups: notificationGroups() };
  }

  async updateSettings(
    userId: string,
    settings: NotificationSettings,
  ): Promise<NotificationSettingsView> {
    // Kept in the groups' order, without repeats.
    const groups = notificationGroups();
    const muted = groups.filter((group) => settings.muted.includes(group));
    await this.notifications.saveMuted(userId, muted);
    return { muted, groups };
  }

  /** Add the notifications the sources call for today. Deleted ones are not made again. */
  async refresh(userId: string): Promise<void> {
    const [muted, today] = await Promise.all([
      this.notifications.mutedGroups(userId),
      this.profiles.today(userId),
    ]);
    const active = this.sources().filter((source) => !muted.includes(source.group));
    const found = await Promise.all(active.map((source) => source.candidates(userId, today)));
    await this.notifications.addMissing(userId, found.flat());
  }

  private async get(id: string, userId: string): Promise<Notification> {
    const notification = await this.notifications.findById(id, userId);
    if (!notification) {
      throw new AppError(404, ERROR_CODES.NOTIFICATION_NOT_FOUND, "Notification not found.");
    }
    return notification;
  }
}

export const notificationService = new NotificationService();
