export const GOAL_STATUSES = ["active", "achieved", "dropped"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export type Count = { done: number; total: number };

export type Milestone = {
  id: string;
  title: string;
  /** YYYY-MM-DD, or null. */
  dueDate: string | null;
  done: boolean;
  doneAt: Date | null;
  position: number;
};

export type Goal = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  status: GoalStatus;
  /** YYYY-MM-DD, or null. */
  targetDate: string | null;
  achievedAt: Date | null;
  workspaceId: string;
  /** Projects working toward it; their tasks count in its progress. */
  projectIds: string[];
  milestones: Count;
  /** Top-level tasks of the linked projects. */
  tasks: Count;
  /** 0–100: milestones and linked tasks done, out of all of them (100 when achieved). */
  progress: number;
  /** Active and past its target date. */
  overdue: boolean;
  /** The first milestone not done, or null. */
  nextMilestone: Pick<Milestone, "id" | "title" | "dueDate"> | null;
  createdAt: Date;
  updatedAt: Date;
};

/** GET /goals/:id: with its milestones in order. */
export type GoalDetail = Goal & { milestoneList: Milestone[] };
