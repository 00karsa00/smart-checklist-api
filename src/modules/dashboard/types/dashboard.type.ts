import { DayCount, Task } from "../../task/types/task.type";
import { ProjectSummary } from "../../workspace/types/workspace.type";

/** An active project with how far along its tasks are. */
export type ProjectProgress = ProjectSummary & { progress: { done: number; total: number } };

/** GET /dashboard: the user's day at a glance. */
export type Dashboard = {
  /** YYYY-MM-DD in the user's time zone. */
  today: string;
  counts: {
    overdue: number;
    dueToday: number;
    /** Due in the next 7 days, today not included. */
    upcoming: number;
    /** Open tasks without a due date. */
    noDate: number;
    completedToday: number;
    /** The last 7 days, today included. */
    completedThisWeek: number;
  };
  /** The most overdue first, at most DASHBOARD_LIMITS.overdue. */
  overdue: Task[];
  /** Every task due today, at most DASHBOARD_LIMITS.dueToday. */
  dueToday: Task[];
  /** Soonest first, at most DASHBOARD_LIMITS.upcoming. */
  upcoming: Task[];
  /** Active projects, overdue and soonest due first, at most DASHBOARD_LIMITS.projects. */
  projects: ProjectProgress[];
  /** Tasks completed on each of the last 7 days, oldest first. */
  completedByDay: DayCount[];
};

export const DASHBOARD_LIMITS = { overdue: 10, dueToday: 50, upcoming: 10, projects: 6 } as const;
