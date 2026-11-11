/** One thing found: what kind, which one, its name and figures for the app to show. */
export type SearchHit = {
  /** The source's kind, e.g. "task". */
  kind: string;
  id: string;
  title: string;
  /** Details the app words itself, e.g. { dueDate, status } for a task. */
  data: Record<string, string | null>;
};

/**
 * One kind of record that can be searched. A module registers one with
 * registerSearchSource; the search module never imports it.
 */
export type SearchSource = {
  /** e.g. "task"; unique. */
  kind: string;
  /** Records matching `query` (already trimmed, at least 2 characters), at most `limit`. */
  search(userId: string, query: string, limit: number): Promise<SearchHit[]>;
};

/** GET /search: one group per kind with results, in registration order. */
export type SearchResult = {
  query: string;
  groups: { kind: string; hits: SearchHit[] }[];
};
