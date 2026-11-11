import { PROJECT_STATUSES, ProjectSummary } from "./types/workspace.type";

/**
 * How projects are listed: archived last; then active, on hold, completed;
 * then the nearest due date (none last); then by name.
 */
export function compareProjects(a: ProjectSummary, b: ProjectSummary): number {
  const status = (project: ProjectSummary) => PROJECT_STATUSES.indexOf(project.status);
  return (
    Number(a.isArchived) - Number(b.isArchived) ||
    status(a) - status(b) ||
    (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31") ||
    a.name.localeCompare(b.name)
  );
}

/** Past its due date (before `today`) and not completed. */
export const isOverdue = (
  project: Pick<ProjectSummary, "dueDate" | "status">,
  today: string,
): boolean => project.status !== "completed" && project.dueDate !== null && project.dueDate < today;
