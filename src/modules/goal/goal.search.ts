import { registerSearchSource, searchInList } from "../search/search.sources";
import { goalService } from "./goal.service";

registerSearchSource({
  kind: "goal",
  search: async (userId, query, limit) =>
    searchInList(
      await goalService.list(userId, {}),
      query,
      limit,
      (goal) => goal.title,
      (goal) => ({
        kind: "goal",
        id: goal.id,
        title: goal.title,
        data: { status: goal.status, progress: String(goal.progress), color: goal.color },
      }),
      (goal) => goal.description,
    ),
});
