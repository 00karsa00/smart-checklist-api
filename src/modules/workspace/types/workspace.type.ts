export const PROJECT_STATUSES = ["active", "on_hold", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** A area of life or work: Personal, Work, Freelance… */
export type Workspace = {
  id: string;
  name: string;
  /** #RRGGBB, or null for the app's default. */
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** GET /workspaces: each with how many projects are open (not archived or completed). */
export type WorkspaceSummary = Workspace & { openProjects: number };

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string | null;
  status: ProjectStatus;
  /** YYYY-MM-DD, or null. */
  dueDate: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** A project as lists show it: past its due date and not completed. */
export type ProjectSummary = Project & { overdue: boolean };
