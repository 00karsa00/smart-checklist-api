import { AppError, ERROR_CODES, isNonEmptyString, validationError } from "../../common";

import { AccountDirectory, LoginAccount, LoginMethod } from "../accounts";
import { LoginCredentials } from "./dto/auth.dto";

/** Checks the submitted credentials for one login method. Throws AppError on failure. */
export type LoginVerifier = (
  account: LoginAccount,
  data: LoginCredentials,
  directory: AccountDirectory,
) => Promise<void>;

function invalidCredentials(message: string): AppError {
  return new AppError(401, ERROR_CODES.INVALID_CREDENTIALS, message);
}

const verifyPasswordLogin: LoginVerifier = async (account, data, directory) => {
  if (!isNonEmptyString(data.password)) {
    throw validationError("Field 'password' is required.");
  }

  if (!(await directory.secrets.passwordMatches(account.id, data.password))) {
    throw invalidCredentials("Incorrect password.");
  }
};

/**
 * How each login method is checked, for every kind of account. Add a method
 * (e.g. "otp") to LOGIN_METHODS, then one entry here and its secret tables.
 */
export const LOGIN_VERIFIERS: Readonly<Record<LoginMethod, LoginVerifier>> = {
  password: verifyPasswordLogin,
};
