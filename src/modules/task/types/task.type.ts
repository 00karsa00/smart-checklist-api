import { PaginatedData } from "../../../common";

import { RepeatRule } from "../task.repeat";

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Lowest first; stored as its index, so lists sort by it. */
export const TASK_PRIORITIES = ["none", "low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** GET /tasks?due=…, in the user's time zone. */
export const DUE_FILTERS = ["today", "overdue", "upcoming", "none"] as const;
export type DueFilter = (typeof DUE_FILTERS)[number];

/** How many days ahead "upcoming" looks, today not included. */
export const UPCOMING_DAYS = 7;

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** YYYY-MM-DD, or null. */
  dueDate: string | null;
  /** HH:MM in the user's time zone, or null. */
  dueTime: string | null;
  /** When to remind: "YYYY-MM-DDTHH:MM" in the user's time zone, or null. */
  remindAt: string | null;
  /** How it repeats, or null. Completing it adds the next copy. */
  repeat: RepeatRule | null;
  /** The copy added when this repeating task was completed, or null. */
  nextId: string | null;
  /** Where it sits: a project (and that project's workspace), or a workspace alone. */
  workspaceId: string;
  projectId: string | null;
  /** The task this is a subtask of; subtasks sit with their parent. */
  parentId: string | null;
  categoryId: string | null;
  tagIds: string[];
  completedAt: Date | null;
  /** Past its due date (and time) and not done. */
  overdue: boolean;
  /** Subtasks, done and in all (0 / 0 for a subtask). */
  subtasks: { done: number; total: number };
  createdAt: Date;
  updatedAt: Date;
};

/** GET /tasks/:id: the task with its subtasks. */
export type TaskDetail = Task & { children: Task[] };

export type TaskList = PaginatedData<Task>;

/** How many on one day, e.g. tasks completed. */
export type DayCount = { /** YYYY-MM-DD */ date: string; count: number };
