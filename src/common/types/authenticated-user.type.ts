/** Kinds of account that can sign in. Each token says which one it belongs to. */
export const ACCOUNT_KINDS = ["admin", "user"] as const;
export type AccountKind = (typeof ACCOUNT_KINDS)[number];

export type AuthenticatedUser = {
  userId: string;
  kind: AccountKind;
  /** The session this request's access token belongs to (absent on old tokens). */
  sessionId?: string;
};
