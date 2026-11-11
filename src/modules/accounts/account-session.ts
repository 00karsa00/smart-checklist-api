import { AppError, authenticateAs, currentUserId, ERROR_CODES } from "../../common";
import { Guard } from "../../infrastructure/http";
import { isUniqueViolation } from "../../infrastructure/database";

import { AccountDirectory, LoginAccount } from "./types/account.type";

/** The signed-in account. A 401 once it is deleted or deactivated, ending the session. */
export async function getSessionAccount<A extends LoginAccount>(
  directory: AccountDirectory<A>,
  id: string,
): Promise<A> {
  const account = await directory.findById(id);
  if (!account?.isActive) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "Your session is no longer valid.");
  }
  return account;
}

/**
 * Module guards for routes only an active account of this kind may use.
 * A token alone is not enough: the account must still exist and be active.
 */
export function requireActiveAccount(directory: AccountDirectory): Guard[] {
  return [
    authenticateAs(directory.kind),
    async (ctx) => {
      await getSessionAccount(directory, currentUserId(ctx));
    },
  ];
}

/**
 * Run a write and turn a UNIQUE violation on one of `conflicts`' columns into
 * that column's error (e.g. 409 "This email is already in use.").
 */
export async function withUniqueColumns<T>(
  write: Promise<T>,
  conflicts: Record<string, () => AppError>,
): Promise<T> {
  try {
    return await write;
  } catch (error) {
    const column = Object.keys(conflicts).find((name) => isUniqueViolation(error, name));
    if (column) throw conflicts[column]();
    throw error;
  }
}
