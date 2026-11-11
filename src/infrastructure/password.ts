import { randomBytes, scrypt, ScryptOptions, timingSafeEqual } from "node:crypto";

// Password hashing. The only file that knows the algorithm, so it can move to
// argon2 or bcrypt later without touching modules. Stored format:
//   scrypt$<N>$<r>$<p>$<salt base64url>$<hash base64url>
// The parameters travel with each hash, so old hashes still verify after they change.

const ALGORITHM = "scrypt";
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const COST: Required<Pick<ScryptOptions, "N" | "r" | "p">> = { N: 16384, r: 8, p: 1 };

function derive(password: string, salt: Buffer, options: typeof COST): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, COST);
  return [
    ALGORITHM,
    COST.N,
    COST.r,
    COST.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

/** True when `password` matches `stored`. Never throws; a malformed hash is a mismatch. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, N, r, p, salt, hash] = stored.split("$");
  if (algorithm !== ALGORITHM || !salt || !hash) return false;

  try {
    const expected = Buffer.from(hash, "base64url");
    const key = await derive(password, Buffer.from(salt, "base64url"), {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    });
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
