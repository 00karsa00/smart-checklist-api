import { NotificationModel, NotificationSettingModel } from "../../infrastructure/database";

import { Candidate, Notification } from "./types/notification.type";

function toNotification(row: NotificationModel): Notification {
  return {
    id: row.id,
    kind: row.kind,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    title: row.title,
    data: row.data as Notification["data"],
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

/** Notifications and notification settings, always scoped by `userId`. */
export class NotificationRepository {
  /** Save the candidates whose dedupe key the user does not have yet. */
  async addMissing(userId: string, candidates: readonly Candidate[]): Promise<void> {
    if (candidates.length === 0) return;
    // ON CONFLICT DO NOTHING on (user, dedupe key): safe when two requests refresh at once.
    await NotificationModel.bulkCreate(
      candidates.map((item) => ({ ...item, userId })),
      { ignoreDuplicates: true },
    );
  }

  async findPage(
    userId: string,
    unreadOnly: boolean,
    offset: number,
    limit: number,
  ): Promise<{ rows: Notification[]; count: number }> {
    const { rows, count } = await NotificationModel.findAndCountAll({
      where: { userId, dismissedAt: null, ...(unreadOnly ? { readAt: null } : {}) },
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });
    return { rows: rows.map(toNotification), count };
  }

  unreadCount(userId: string): Promise<number> {
    return NotificationModel.count({ where: { userId, readAt: null, dismissedAt: null } });
  }

  async findById(id: string, userId: string): Promise<Notification | null> {
    const row = await NotificationModel.findOne({ where: { id, userId, dismissedAt: null } });
    return row ? toNotification(row) : null;
  }

  async setRead(id: string, userId: string, read: boolean): Promise<void> {
    await NotificationModel.update({ readAt: read ? new Date() : null }, { where: { id, userId } });
  }

  /** Returns how many were unread. */
  async markAllRead(userId: string): Promise<number> {
    const [updated] = await NotificationModel.update(
      { readAt: new Date() },
      { where: { userId, readAt: null, dismissedAt: null } },
    );
    return updated;
  }

  /** Hide it; the row stays so the same situation is not notified again. */
  async dismiss(id: string, userId: string): Promise<void> {
    await NotificationModel.update({ dismissedAt: new Date() }, { where: { id, userId } });
  }

  async mutedGroups(userId: string): Promise<string[]> {
    const row = await NotificationSettingModel.findByPk(userId);
    return row?.muted ?? [];
  }

  async saveMuted(userId: string, muted: readonly string[]): Promise<void> {
    await NotificationSettingModel.upsert({ userId, muted: [...muted] });
  }
}

export const notificationRepository = new NotificationRepository();
