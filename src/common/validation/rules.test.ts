import { describe, expect, it } from "vitest";

import { assertPageQuery, isDate, isEmail, isOneOf, isUuid, isUuidV4 } from "./rules";

describe("validation rules", () => {
  it("checks UUIDs", () => {
    expect(isUuid("4b2c77c8-e65b-4232-a395-57bce4f05b86")).toBe(true);
    expect(isUuid("4b2c77c8-e65b-1232-a395-57bce4f05b86")).toBe(true);
    expect(isUuidV4("4b2c77c8-e65b-1232-a395-57bce4f05b86")).toBe(false);
    expect(isUuid("abc")).toBe(false);
  });

  it("only accepts real YYYY-MM-DD dates", () => {
    expect(isDate("2024-02-29")).toBe(true);
    expect(isDate("2024-13-01")).toBe(false);
    expect(isDate("01-02-2024")).toBe(false);
    expect(isDate(20240101)).toBe(false);
  });

  it("checks emails and allowed values", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("nope")).toBe(false);
    expect(isOneOf("saving", ["saving", "current"])).toBe(true);
    expect(isOneOf(1, ["1"])).toBe(false);
  });

  it("validates page and limit", () => {
    expect(() => assertPageQuery({ page: "2", limit: "100" })).not.toThrow();
    expect(() => assertPageQuery({ page: "0" })).toThrow(
      "Query param 'page' must be a positive integer.",
    );
    expect(() => assertPageQuery({ limit: "101" })).toThrow(
      "Query param 'limit' must be an integer between 1 and 100.",
    );
  });
});
