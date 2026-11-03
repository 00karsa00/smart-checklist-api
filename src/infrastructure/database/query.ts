import { Op, UniqueConstraintError } from "sequelize";

// Query building blocks for repositories, so repositories never import the ORM.
// Each helper returns a value for one field in a `where` object.

export type Where = Record<string | symbol, unknown>;

/** Case-insensitive "contains" match. */
export function containsText(text: string) {
  return { [Op.iLike]: `%${text}%` };
}

/** Inclusive range; either end may be left out. Returns undefined when both are. */
export function between<T>(from?: T, to?: T) {
  if (from === undefined && to === undefined) return undefined;
  const range: Where = {};
  if (from !== undefined) range[Op.gte] = from;
  if (to !== undefined) range[Op.lte] = to;
  return range;
}

/** Add "match any of these conditions" to a where object. */
export function matchAny(where: Where, conditions: Where[]): Where {
  where[Op.or] = conditions;
  return where;
}

/** True when a write failed because it broke a UNIQUE constraint. */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof UniqueConstraintError;
}
