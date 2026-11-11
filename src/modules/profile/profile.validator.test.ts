import { describe, expect, it } from "vitest";

import { fakeContext } from "../../test-support/fakes";
import { validateUpdateSettings } from "./profile.validator";

const run = (body: Record<string, unknown>) => {
  const ctx = fakeContext({ body });
  validateUpdateSettings(ctx);
  return ctx.body;
};

describe("validateUpdateSettings", () => {
  it("accepts every setting and upper-cases the currency", () => {
    expect(
      run({
        currency: " usd ",
        locale: "en-US",
        timeZone: "America/New_York",
        weekStartsOn: 0,
      }),
    ).toMatchObject({ currency: "USD" });
  });

  it.each([
    [{ currency: "XYZ" }, /currency/],
    [{ currency: "rupees" }, /currency/],
    [{ locale: "english" }, /locale/],
    [{ locale: "en-in" }, /locale/],
    [{ timeZone: "Mars/Olympus" }, /timeZone/],
    [{ weekStartsOn: 7 }, /weekStartsOn/],
    [{ weekStartsOn: 1.5 }, /weekStartsOn/],
    [{ weekStartsOn: "5" }, /weekStartsOn/],
    [{ theme: "dark" }, /'theme' is not a setting/],
    [{}, /at least one/],
  ])("refuses %j", (body, message) => {
    expect(() => run(body)).toThrow(message);
  });
});
