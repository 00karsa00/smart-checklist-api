import { registerSearchSource, searchInList } from "../search/search.sources";
import { categoryService, LabelService, tagService } from "./label.service";

/** Categories and tags by name, archived ones too. */
function labelSource(service: LabelService) {
  const { kind } = service.config;
  registerSearchSource({
    kind,
    search: async (userId, query, limit) =>
      searchInList(
        await service.list(userId, true),
        query,
        limit,
        (label) => label.name,
        (label) => ({
          kind,
          id: label.id,
          title: label.name,
          data: { color: label.color, archived: label.isArchived ? "true" : null },
        }),
      ),
  });
}

labelSource(categoryService);
labelSource(tagService);
