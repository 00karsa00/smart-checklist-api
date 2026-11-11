import { registerSearchSource, searchInList } from "../search/search.sources";
import { workspaceService } from "./workspace.service";

registerSearchSource({
  kind: "project",
  search: async (userId, query, limit) =>
    searchInList(
      await workspaceService.listProjects(userId, { includeArchived: true }),
      query,
      limit,
      (project) => project.name,
      (project) => ({
        kind: "project",
        id: project.id,
        title: project.name,
        data: {
          workspaceId: project.workspaceId,
          status: project.status,
          dueDate: project.dueDate,
          color: project.color,
          archived: project.isArchived ? "true" : null,
        },
      }),
      (project) => project.description,
    ),
});

registerSearchSource({
  kind: "workspace",
  search: async (userId, query, limit) =>
    searchInList(
      await workspaceService.listWorkspaces(userId),
      query,
      limit,
      (workspace) => workspace.name,
      (workspace) => ({
        kind: "workspace",
        id: workspace.id,
        title: workspace.name,
        data: { color: workspace.color },
      }),
    ),
});
