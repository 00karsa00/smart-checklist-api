// What a file really is, from its first bytes. Never trust the declared
// Content-Type or file name of an upload on their own.

const SIGNATURES: { type: string; matches: (data: Buffer) => boolean }[] = [
  {
    type: "image/jpeg",
    matches: (data) => data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  },
  {
    type: "image/png",
    matches: (data) =>
      data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    type: "image/webp",
    matches: (data) =>
      data.subarray(0, 4).toString("latin1") === "RIFF" &&
      data.subarray(8, 12).toString("latin1") === "WEBP",
  },
  {
    type: "application/pdf",
    matches: (data) => data.subarray(0, 5).toString("latin1") === "%PDF-",
  },
];

/** The MIME type the bytes show (JPEG, PNG, WebP or PDF), or null for anything else. */
export function detectFileType(data: Buffer): string | null {
  return SIGNATURES.find((signature) => signature.matches(data))?.type ?? null;
}

/** File types `detectFileType` can recognise. */
export const DETECTABLE_FILE_TYPES = SIGNATURES.map((signature) => signature.type);
