import { ForeignKeyConstraintError, Op, UniqueConstraintError } from "sequelize";

// Query building blocks for repositories, so repositories never import the ORM.
// Each helper returns a value for one field in a `where` object.

export type Where = Record<string | symbol, unknown>;

/** Case-insensitive "contains" match. */
export function containsText(text: string) {
  return { [Op.iLike]: `%${text}%` };
}

/** Any value except `value`. */
export function notEqual<T>(value: T) {
  return { [Op.ne]: value };
}

/** Any of these values (SQL IN). */
export function oneOf<T>(values: readonly T[]) {
  return { [Op.in]: values };
}

/**
 * Add "at least one of these conditions" to a where object, alongside any
 * others already there (unlike `matchAny`, several can be combined).
 */
export function requireAny(where: Where, conditions: Where[]): Where {
  const and = (where[Op.and] as Where[] | undefined) ?? [];
  where[Op.and] = [...and, { [Op.or]: conditions }];
  return where;
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

/**
 * True when a write failed because it broke a UNIQUE constraint; with `column`
 * (e.g. "email"), only when that column caused it.
 */
export function isUniqueViolation(error: unknown, column?: string): boolean {
  if (!(error instanceof UniqueConstraintError)) return false;
  return column === undefined || Object.hasOwn(error.fields ?? {}, column);
}

/** True when a write failed because a row it removes or changes is still referenced. */
export function isForeignKeyViolation(error: unknown): boolean {
  return error instanceof ForeignKeyConstraintError;
}
