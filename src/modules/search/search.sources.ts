import { SearchHit, SearchSource } from "./types/search.type";

const sources: SearchSource[] = [];

/** Add a kind of record to search. Call once, when its module loads. */
export function registerSearchSource(source: SearchSource): void {
  if (sources.some((item) => item.kind === source.kind)) {
    throw new Error(`Search source '${source.kind}' is registered twice.`);
  }
  sources.push(source);
}

export const searchSources = (): readonly SearchSource[] => sources;

/**
 * How well `text` matches `query` (lower is better): the whole text, its
 * start, the start of a word, anywhere; null for no match. Case does not matter.
 */
export function matchRank(text: string | null | undefined, query: string): number | null {
  if (!text) return null;
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  if (haystack === needle) return 0;
  if (haystack.startsWith(needle)) return 1;
  if (haystack.includes(` ${needle}`)) return 2;
  return haystack.includes(needle) ? 3 : null;
}

/**
 * Records whose name (or else other text) matches, best first, at most
 * `limit`: for sources that search a short list in memory.
 */
export function searchInList<T>(
  items: readonly T[],
  query: string,
  limit: number,
  name: (item: T) => string,
  toHit: (item: T) => SearchHit,
  otherText: (item: T) => string | null = () => null,
): SearchHit[] {
  return items
    .map((item) => ({
      item,
      rank: matchRank(name(item), query) ?? (matchRank(otherText(item), query) === null ? null : 4),
    }))
    .filter((entry): entry is { item: T; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank || name(a.item).localeCompare(name(b.item)))
    .slice(0, limit)
    .map((entry) => toHit(entry.item));
}
