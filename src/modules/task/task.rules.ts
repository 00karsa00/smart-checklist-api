import { addDays } from "../../common";

import { DueFilter, TASK_PRIORITIES, TaskPriority, UPCOMING_DAYS } from "./types/task.type";

export const priorityToNumber = (priority: TaskPriority): number =>
  TASK_PRIORITIES.indexOf(priority);
export const priorityFromNumber = (value: number): TaskPriority => TASK_PRIORITIES[value] ?? "none";

/**
 * Past due and not done. `now` is the user's local date and time
 * ("YYYY-MM-DD", "HH:MM"); a task due today with no time is not overdue yet.
 */
export function isOverdue(
  task: { status: string; dueDate: string | null; dueTime: string | null },
  now: { date: string; time: string },
): boolean {
  if (task.status === "done" || !task.dueDate) return false;
  if (task.dueDate !== now.date) return task.dueDate < now.date;
  return task.dueTime !== null && task.dueTime < now.time;
}

/** The due dates a filter means, as an inclusive range; `null` for "no due date". */
export function dueRange(filter: DueFilter, today: string): { from?: string; to?: string } | null {
  switch (filter) {
    case "today":
      return { from: today, to: today };
    case "overdue":
      return { to: addDays(today, -1) };
    case "upcoming":
      return { from: addDays(today, 1), to: addDays(today, UPCOMING_DAYS) };
    case "none":
      return null;
  }
}
