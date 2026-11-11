import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

import { configuration } from "../config/configuration";

/**
 * Where uploaded files live. Modules use `fileStorage` and never the disk, so
 * moving to S3 or similar means another implementation of this type here.
 * Keys are made by the server (never from user input), e.g. "attachments/<user>/<uuid>".
 */
export type FileStorage = {
  save(key: string, data: Buffer): Promise<void>;
  /** The file's bytes; throws when it does not exist. */
  read(key: string): Promise<Buffer>;
  /** Remove the file; a missing file is not an error. */
  remove(key: string): Promise<void>;
};

/** Files under `root` on the local disk. */
export function createLocalFileStorage(root: string): FileStorage {
  const base = resolve(root);
  const pathOf = (key: string) => {
    const path = resolve(base, key);
    if (!path.startsWith(base + sep)) throw new Error(`Invalid storage key: ${key}`);
    return path;
  };

  return {
    async save(key, data) {
      const path = pathOf(key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, data, { flag: "wx" });
    },
    read: (key) => readFile(pathOf(key)),
    remove: (key) => rm(pathOf(key), { force: true }),
  };
}

export const fileStorage: FileStorage = createLocalFileStorage(configuration.storage.uploadDir);
