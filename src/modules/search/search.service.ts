import { searchSources } from "./search.sources";
import { SearchResult, SearchSource } from "./types/search.type";

/** Results per kind. */
export const SEARCH_LIMIT = 8;

/** Searches every registered source at once (see search.sources.ts). */
export class SearchService {
  constructor(private readonly sources: () => readonly SearchSource[] = searchSources) {}

  async search(userId: string, query: string): Promise<SearchResult> {
    const found = await Promise.all(
      this.sources().map(async (source) => ({
        kind: source.kind,
        hits: await source.search(userId, query, SEARCH_LIMIT),
      })),
    );
    return { query, groups: found.filter((group) => group.hits.length > 0) };
  }
}

export const searchService = new SearchService();
