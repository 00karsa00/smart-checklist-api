import { describe, expect, it } from "vitest";

import { detectFileType } from "./file-type";

describe("detectFileType", () => {
  it.each([
    [[0xff, 0xd8, 0xff, 0xe0], "image/jpeg"],
    [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png"],
    [[...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")], "image/webp"],
    [[...Buffer.from("%PDF-1.7")], "application/pdf"],
  ])("recognises %j as %s", (bytes, type) => {
    expect(detectFileType(Buffer.from(bytes))).toBe(type);
  });

  it("does not trust a name or label: text, HTML and scripts are unknown", () => {
    expect(detectFileType(Buffer.from("<html><script>alert(1)</script>"))).toBeNull();
    expect(detectFileType(Buffer.from("hello"))).toBeNull();
    expect(detectFileType(Buffer.alloc(0))).toBeNull();
  });
});
