import { ProjectStatus } from "../types/workspace.type";

export type CreateWorkspaceDto = { name: string; color?: string | null };
export type UpdateWorkspaceDto = Partial<CreateWorkspaceDto>;

export type CreateProjectDto = {
  workspaceId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  status?: ProjectStatus;
  dueDate?: string | null;
};
/** workspaceId moves the project to another of the user's workspaces. */
export type UpdateProjectDto = Partial<CreateProjectDto> & { isArchived?: boolean };

export type ProjectListQuery = {
  workspaceId?: string;
  status?: string;
  /** "true" to include archived projects. */
  includeArchived?: string;
};
