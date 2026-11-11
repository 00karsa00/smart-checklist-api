import { DueFilter, TaskPriority, TaskStatus } from "../types/task.type";

export type CreateTaskDto = {
  title: string;
  notes?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  dueTime?: string | null;
  /** A project, or a workspace; neither: the user's first workspace. */
  projectId?: string | null;
  workspaceId?: string;
  /** Makes it a subtask of this task. */
  parentId?: string;
  categoryId?: string | null;
  tagIds?: string[];
};

export type UpdateTaskDto = Omit<Partial<CreateTaskDto>, "parentId">;

export type TaskListQuery = {
  page?: string;
  limit?: string;
  workspaceId?: string;
  projectId?: string;
  categoryId?: string;
  tagId?: string;
  status?: TaskStatus;
  due?: DueFilter;
  /** Words in the title or notes. */
  q?: string;
  /** "true" to include done tasks. */
  includeDone?: string;
};
