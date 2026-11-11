import { registerSearchSource, searchInList } from "../search/search.sources";
import { taskService } from "./task.service";

// Tasks by title and notes (done ones too, after open ones): the database
// narrows them, then the closest titles come first.
registerSearchSource({
  kind: "task",
  search: async (userId, query, limit) => {
    const { items } = await taskService.list(
      userId,
      { search: query, includeDone: true },
      { page: 1, limit: 50 },
    );
    return searchInList(
      items,
      query,
      limit,
      (task) => task.title,
      (task) => ({
        kind: "task",
        id: task.id,
        title: task.title,
        data: {
          status: task.status,
          dueDate: task.dueDate,
          projectId: task.projectId,
          workspaceId: task.workspaceId,
        },
      }),
      (task) => task.notes,
    );
  },
});
