import { ModelStatic, Optional } from "sequelize";
import { Model } from "sequelize-typescript";

// Every kind of account (admin, user) has the same secret and login-log
// tables, each with its own name and foreign key. The models map their
// columns onto these shared attributes, so one repository serves them all.

export type PasswordAttributes = {
  id: string;
  /** The owning account's id (admin_user_id, app_user_id, …). */
  accountId: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PasswordCreationAttributes = Optional<
  PasswordAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export type LoginLogAttributes = {
  id: string;
  /** The matching account, or null when the identifier matched none. */
  accountId: string | null;
  /** What was typed to sign in: a user name, email or phone. */
  identifier: string;
  loginMethod: string | null;
  isSuccess: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export type LoginLogCreationAttributes = Optional<
  LoginLogAttributes,
  "id" | "accountId" | "loginMethod" | "failureReason" | "ipAddress" | "userAgent" | "createdAt"
>;

export type SessionAttributes = {
  id: string;
  accountId: string;
  /** SHA-256 of the refresh token; the token itself is never stored. */
  tokenHash: string;
  /** Hash of the token the last refresh replaced, to detect it being reused. */
  previousTokenHash: string | null;
  /** When the token was last refreshed. */
  rotatedAt: Date | null;
  expiresAt: Date;
  /** Set on logout, rotation, password change or deactivation. */
  revokedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SessionCreationAttributes = Optional<
  SessionAttributes,
  | "id"
  | "previousTokenHash"
  | "rotatedAt"
  | "revokedAt"
  | "ipAddress"
  | "userAgent"
  | "createdAt"
  | "updatedAt"
>;

export type PasswordTable = ModelStatic<
  Model<PasswordAttributes, PasswordCreationAttributes> & PasswordAttributes
>;

export type LoginLogTable = ModelStatic<
  Model<LoginLogAttributes, LoginLogCreationAttributes> & LoginLogAttributes
>;

export type SessionTable = ModelStatic<
  Model<SessionAttributes, SessionCreationAttributes> & SessionAttributes
>;
