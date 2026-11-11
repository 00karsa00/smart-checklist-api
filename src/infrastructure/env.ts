import dotenv from "dotenv";

// The only place that reads process.env. Values from the real environment win
// over values in .env, so tests and deployments can override anything.
dotenv.config({ quiet: true });

export function readEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

/** Read a variable that has no safe default. Fails at startup, not on first use. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable ${name}. See .env.example.`);
  }
  return value;
}

/** A number setting; 0 is a value (not "unset"). Missing or not a number → fallback. */
export function readNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function readBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}
