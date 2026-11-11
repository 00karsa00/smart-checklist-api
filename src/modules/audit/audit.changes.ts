import { FieldChange } from "./types/audit.type";

/** The fields whose value differs between two versions of a record, with both values. */
export function changesBetween<T extends object>(
  before: T,
  after: T,
  fields: readonly (keyof T & string)[],
): Record<string, FieldChange> {
  const changes: Record<string, FieldChange> = {};
  for (const field of fields) {
    if (before[field] !== after[field]) changes[field] = { from: before[field], to: after[field] };
  }
  return changes;
}
