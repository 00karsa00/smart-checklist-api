import { oneOf, requireAny, Where } from "../../infrastructure/database";

/** Records in a workspace (directly or in its projects), or in one project. */
export type PlaceFilter = {
  /** From workspaceService.placesIn. */
  placement?: { workspaceId: string; projectIds: string[] };
  projectId?: string;
};

/** Narrow a repository's `where` to a place filter (tasks and notes sit in places). */
export function wherePlaced(where: Where, filter: PlaceFilter): Where {
  if (filter.placement) {
    const { workspaceId, projectIds } = filter.placement;
    requireAny(where, [{ workspaceId }, { projectId: oneOf(projectIds) }]);
  }
  if (filter.projectId) where.projectId = filter.projectId;
  return where;
}
