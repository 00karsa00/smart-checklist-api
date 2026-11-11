import { Candidate, Notification, NotificationSource } from "./types/notification.type";

const sources: NotificationSource[] = [];

/** Add an area that makes notifications. Call once, when its module loads. */
export function registerNotificationSource(source: NotificationSource): void {
  if (sources.some((item) => item.group === source.group)) {
    throw new Error(`Notification group '${source.group}' is registered twice.`);
  }
  sources.push(source);
}

/** Every registered source, in the order they were added. */
export const notificationSources = (): readonly NotificationSource[] => sources;

/** Every settings switch, in registration order. */
export const notificationGroups = (): string[] => sources.map((source) => source.group);

/**
 * A candidate notification. `occasion` (a due date, a month) makes the
 * situation unique, so it is made once however often sources run, and again
 * the next time it happens.
 */
export const candidate = (
  kind: string,
  subject: Pick<Notification, "subjectType" | "subjectId" | "title">,
  data: Candidate["data"],
  occasion = "",
): Candidate => ({
  kind,
  ...subject,
  data,
  dedupeKey: [kind, subject.subjectId, occasion].filter(Boolean).join(":"),
});
