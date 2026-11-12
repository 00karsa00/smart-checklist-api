import { GoalStatus } from "../types/goal.type";

export type CreateGoalDto = {
  title: string;
  description?: string | null;
  color?: string | null;
  /** The user's first workspace when left out. */
  workspaceId?: string;
  targetDate?: string | null;
  /** Milestone titles to start with, in order. */
  milestones?: string[];
  projectIds?: string[];
};

export type UpdateGoalDto = Omit<Partial<CreateGoalDto>, "milestones"> & { status?: GoalStatus };

export type CreateMilestoneDto = { title: string; dueDate?: string | null };
export type UpdateMilestoneDto = Partial<CreateMilestoneDto> & { done?: boolean };

export type GoalListQuery = { status?: string; workspaceId?: string };
