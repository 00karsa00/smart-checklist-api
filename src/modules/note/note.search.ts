import { registerSearchSource, searchInList } from "../search/search.sources";
import { noteService } from "./note.service";

// Notes by title and text, archived ones too: the database narrows them,
// then the closest titles come first.
registerSearchSource({
  kind: "note",
  search: async (userId, query, limit) => {
    const { items } = await noteService.list(
      userId,
      { search: query, includeArchived: true },
      { page: 1, limit: 50 },
    );
    return searchInList(
      items,
      query,
      limit,
      (note) => note.title,
      (note) => ({
        kind: "note",
        id: note.id,
        title: note.title,
        data: { archived: note.isArchived ? "true" : null, taskId: note.taskId },
      }),
      (note) => note.body,
    );
  },
});
