import { describe, expect, it } from "vitest";

import { buildPaginatedData, pageOffset, parsePageQuery } from "./pagination";

describe("parsePageQuery", () => {
  it("uses defaults when nothing is sent", () => {
    expect(parsePageQuery({})).toEqual({ page: 1, limit: 10 });
    expect(parsePageQuery({}, 100)).toEqual({ page: 1, limit: 100 });
  });

  it("clamps out-of-range and junk values", () => {
    expect(parsePageQuery({ page: "0", limit: "500" })).toEqual({ page: 1, limit: 100 });
    expect(parsePageQuery({ page: "abc", limit: "-3" })).toEqual({ page: 1, limit: 1 });
  });

  it("keeps valid values", () => {
    expect(parsePageQuery({ page: "3", limit: "25" })).toEqual({ page: 3, limit: 25 });
  });
});

describe("pageOffset", () => {
  it("skips the earlier pages", () => {
    expect(pageOffset({ page: 3, limit: 20 })).toBe(40);
  });
});

describe("buildPaginatedData", () => {
  it("computes total pages", () => {
    expect(buildPaginatedData(["a"], { page: 1, limit: 2, total: 5 }).pagination).toEqual({
      page: 1,
      limit: 2,
      total: 5,
      totalPages: 3,
    });
  });

  it("reports zero pages for an empty list", () => {
    expect(buildPaginatedData([], { page: 1, limit: 10, total: 0 }).pagination.totalPages).toBe(0);
  });
});
