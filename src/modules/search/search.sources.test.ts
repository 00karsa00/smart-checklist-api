import { describe, expect, it } from "vitest";

import { matchRank, searchInList } from "./search.sources";

describe("matchRank", () => {
  it("prefers the whole name, then its start, then a word start", () => {
    expect(matchRank("Home", "home")).toBe(0);
    expect(matchRank("Homework", "home")).toBe(1);
    expect(matchRank("Fix the home wifi", "home")).toBe(2);
    expect(matchRank("Phone bill", "hone")).toBe(3);
    expect(matchRank("Garden", "home")).toBeNull();
    expect(matchRank(null, "home")).toBeNull();
  });
});

describe("searchInList", () => {
  it("ranks names first, other text after, and cuts at the limit", () => {
    const items = [
      { name: "Old house", note: "home move" },
      { name: "Homework", note: null },
      { name: "Home", note: null },
      { name: "My home office", note: null },
      { name: "Garden", note: null },
    ];
    const hit = (item: (typeof items)[number]) => ({
      kind: "x",
      id: item.name,
      title: item.name,
      data: {},
    });
    const titles = (limit: number) =>
      searchInList(
        items,
        "home",
        limit,
        (item) => item.name,
        hit,
        (item) => item.note,
      ).map((found) => found.title);
    expect(titles(10)).toEqual(["Home", "Homework", "My home office", "Old house"]);
    expect(titles(2)).toEqual(["Home", "Homework"]);
  });
});
