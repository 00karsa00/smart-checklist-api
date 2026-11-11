export type NotificationListQuery = {
  page?: string;
  limit?: string;
  /** "true" for unread ones only. */
  unread?: string;
};

/** PATCH /notifications/:id */
export type UpdateNotificationDto = { read: boolean };

/** PUT /notifications/settings: the groups to turn off (an empty list turns all on). */
export type UpdateNotificationSettingsDto = { muted: string[] };
