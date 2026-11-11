import { candidate, registerNotificationSource } from "../notification/notification.sources";
import { Candidate } from "../notification/types/notification.type";
import { profileService } from "../profile/profile.service";
import { taskRepository, TaskRow } from "./task.repository";
import { isOverdue } from "./task.rules";

type Now = { date: string; time: string };
type TaskTimes = Pick<TaskRow, "id" | "title" | "status" | "dueDate" | "dueTime" | "remindAt">;

const subject = (task: TaskTimes) => ({
  subjectType: "task",
  subjectId: task.id,
  title: task.title,
});

/** Tasks whose reminder time has come: one notification per reminder time. */
export function reminderCandidates(tasks: readonly TaskTimes[], now: Now): Candidate[] {
  const moment = `${now.date}T${now.time}`;
  return tasks
    .filter((task) => task.status !== "done" && task.remindAt !== null && task.remindAt <= moment)
    .map((task) =>
      candidate(
        "task_reminder",
        subject(task),
        { remindAt: task.remindAt, dueDate: task.dueDate, dueTime: task.dueTime },
        task.remindAt!,
      ),
    );
}

/**
 * Tasks due today, and overdue ones: once per due date for each. A task due
 * today at a time gets "due today" first and "overdue" once the time passes.
 */
export function dueCandidates(tasks: readonly TaskTimes[], now: Now): Candidate[] {
  return tasks.flatMap((task) => {
    if (task.status === "done" || !task.dueDate || task.dueDate > now.date) return [];
    const data = { dueDate: task.dueDate, dueTime: task.dueTime };
    const kind = isOverdue(task, now) ? "task_overdue" : "task_due";
    return [candidate(kind, subject(task), data, task.dueDate)];
  });
}

async function attention(userId: string) {
  const now = await profileService.now(userId);
  const tasks = await taskRepository.findNeedingAttention(
    userId,
    now.date,
    `${now.date}T${now.time}`,
  );
  return { tasks, now };
}

registerNotificationSource({
  group: "reminders",
  candidates: async (userId) => {
    const { tasks, now } = await attention(userId);
    return reminderCandidates(tasks, now);
  },
});

registerNotificationSource({
  group: "due_dates",
  candidates: async (userId) => {
    const { tasks, now } = await attention(userId);
    return dueCandidates(tasks, now);
  },
});
