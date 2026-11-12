import { Count, GoalStatus } from "./types/goal.type";

/**
 * How far along a goal is, 0–100: milestones and linked tasks done out of all
 * of them, each counting once. Achieved goals are 100; with nothing to count, 0.
 */
export function goalProgress(status: GoalStatus, milestones: Count, tasks: Count): number {
  if (status === "achieved") return 100;
  const total = milestones.total + tasks.total;
  return total === 0 ? 0 : Math.floor(((milestones.done + tasks.done) / total) * 100);
}

/** Active and past its target date (before `today`). */
export const goalOverdue = (
  goal: { status: GoalStatus; targetDate: string | null },
  today: string,
) => goal.status === "active" && goal.targetDate !== null && goal.targetDate < today;
