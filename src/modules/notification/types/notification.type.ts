import { PaginatedData } from "../../../common";

export type Notification = {
  id: string;
  /** What happened, named by the module that made it, e.g. "task_due". */
  kind: string;
  /** What it is about, e.g. "task", and its id (it may since have been deleted). */
  subjectType: string;
  subjectId: string;
  /** The record's name when this was made. */
  title: string;
  /** Figures for the message, set by the module that made it. */
  data: Record<string, string | number | null>;
  readAt: Date | null;
  createdAt: Date;
};

/** A notification that should exist; saved only if its dedupe key is new. */
export type Candidate = Pick<
  Notification,
  "kind" | "subjectType" | "subjectId" | "title" | "data"
> & {
  dedupeKey: string;
};

/**
 * One area that makes notifications (task reminders, habits…), and the switch
 * that turns it off in settings. A module registers one with
 * registerNotificationSource; the notifications module never imports it.
 */
export type NotificationSource = {
  /** The settings switch, e.g. "reminders". Unique. */
  group: string;
  /** What the user's records call for today (YYYY-MM-DD in their time zone). */
  candidates(userId: string, today: string): Promise<Candidate[]>;
};

/** GET /notifications */
export type NotificationList = PaginatedData<Notification> & { unreadCount: number };

/** GET/PUT /notifications/settings: the groups turned off, and every group there is. */
export type NotificationSettings = { muted: string[] };
export type NotificationSettingsView = NotificationSettings & { groups: string[] };
