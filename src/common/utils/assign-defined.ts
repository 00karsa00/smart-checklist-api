/**
 * Copy each listed field that the caller sent (not undefined) onto `target`.
 * Used for partial updates, where an absent field means "leave unchanged".
 */
export function assignDefined<T extends object, K extends keyof T>(
  target: T,
  source: Partial<Pick<T, K>>,
  fields: readonly K[],
): void {
  for (const field of fields) {
    const value = source[field];
    if (value !== undefined) target[field] = value as T[K];
  }
}
