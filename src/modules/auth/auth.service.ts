import { configuration } from "../../config/configuration";
import { AccountKind, AppError, ERROR_CODES, isOneOf, requireValidToken } from "../../common";
import { logger } from "../../infrastructure/logger";
import { signToken } from "../../infrastructure/token";

import {
  AccountDirectory,
  getSessionAccount,
  IssuedSession,
  LOGIN_METHODS,
  LoginAccount,
  LoginMethod,
} from "../accounts";
import { CreateUserDto, RegisterUserDto } from "../user/dto/user.dto";
import { AppUser } from "../user/types/user.type";
import { LoginClient, LoginCredentials, ValidateTokenDto } from "./dto/auth.dto";
import { LOGIN_VERIFIERS, LoginVerifier } from "./login-methods";
import { IdentifyResponse, LoginResponse, ValidateTokenResponse } from "./types/auth.type";

/**
 * Authentication for the whole API, for every kind of account (admin, user).
 * Sign-in is two steps: `identify` returns the account's login method, then
 * `login` checks that method's credentials and issues a JWT naming the
 * account kind. Every login attempt is written to that kind's login log.
 */
export class AuthService {
  async identify(directory: AccountDirectory, identifier: string): Promise<IdentifyResponse> {
    const { account } = this.usableAccount(directory, await directory.findByIdentifier(identifier));
    return { loginMethod: account.loginMethod };
  }

  async login<A extends LoginAccount, S>(
    directory: AccountDirectory<A, S>,
    identifier: string,
    data: LoginCredentials,
    client: LoginClient,
  ): Promise<LoginResponse<S>> {
    let found: A | null = null;

    try {
      found = await directory.findByIdentifier(identifier);
      const { account, verify } = this.usableAccount(directory, found);
      await verify(account, data, directory as AccountDirectory);
    } catch (error) {
      const reason = error instanceof AppError ? error.code : ERROR_CODES.INTERNAL_SERVER_ERROR;
      await this.record(directory, identifier, found, client, reason);
      throw error;
    }

    const account = found as A;
    await this.record(directory, identifier, account, client, null);

    return this.tokens(
      directory,
      account,
      await directory.secrets.startSession(account.id, client),
    );
  }

  /** Create a user account (password sign-in) and sign it in. */
  async register<S>(
    directory: AccountDirectory<AppUser, S> & {
      createUser(data: CreateUserDto): Promise<AppUser>;
    },
    data: RegisterUserDto,
    client: LoginClient,
  ): Promise<LoginResponse<S>> {
    if (!configuration.auth.allowRegistration) {
      throw new AppError(
        403,
        ERROR_CODES.REGISTRATION_DISABLED,
        "Sign-up is closed. Ask an administrator for an account.",
      );
    }
    const user = await directory.createUser({ ...data, loginMethod: "password" });
    return this.tokens(directory, user, await directory.secrets.startSession(user.id, client));
  }

  /** A new access token and refresh token for a refresh token (which stops working). */
  async refresh<A extends LoginAccount, S>(
    directory: AccountDirectory<A, S>,
    refreshToken: string,
    client: LoginClient,
  ): Promise<LoginResponse<S>> {
    const { accountId, ...session } = await directory.secrets.rotateSession(refreshToken, client);
    return this.tokens(directory, await getSessionAccount(directory, accountId), session);
  }

  /** End the session of this refresh token. Always succeeds, so logout never fails. */
  async logout(directory: AccountDirectory, refreshToken: string): Promise<null> {
    await directory.secrets.endSession(refreshToken);
    return null;
  }

  /** The signed-in account. Fails once it is deactivated, ending the session. */
  async me<A extends LoginAccount, S>(directory: AccountDirectory<A, S>, id: string): Promise<S> {
    return directory.toSession(await getSessionAccount(directory, id));
  }

  async validateToken(data: ValidateTokenDto): Promise<ValidateTokenResponse> {
    const { sub: userId, kind, iat, exp } = requireValidToken(data.token);

    return {
      valid: true,
      userId,
      kind: kind as AccountKind,
      issuedAt: new Date((iat as number) * 1000),
      expiresAt: new Date((exp as number) * 1000),
    };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private tokens<A extends LoginAccount, S>(
    directory: AccountDirectory<A, S>,
    account: A,
    session: IssuedSession,
  ): LoginResponse<S> {
    return {
      accessToken: signToken(account.id, directory.kind, session.sessionId),
      tokenType: "Bearer",
      expiresIn: configuration.jwt.expiresIn,
      refreshToken: session.refreshToken,
      refreshExpiresAt: session.refreshExpiresAt,
      user: directory.toSession(account),
    };
  }

  /** The account if it may sign in, with the verifier for its login method. */
  private usableAccount<A extends LoginAccount>(
    directory: AccountDirectory<A>,
    account: A | null,
  ): { account: A; verify: LoginVerifier } {
    if (!account) throw directory.notFoundError();
    if (!account.isActive) {
      throw new AppError(403, ERROR_CODES.ACCOUNT_INACTIVE, "This account is deactivated.");
    }
    if (!isOneOf(account.loginMethod, LOGIN_METHODS)) {
      throw new AppError(
        400,
        ERROR_CODES.LOGIN_METHOD_NOT_SUPPORTED,
        `Login method '${account.loginMethod}' is not supported yet.`,
      );
    }

    return { account, verify: LOGIN_VERIFIERS[account.loginMethod as LoginMethod] };
  }

  /** Write the login log. A logging failure never blocks or changes the sign-in result. */
  private async record(
    directory: AccountDirectory,
    identifier: string,
    account: LoginAccount | null,
    client: LoginClient,
    failureReason: string | null,
  ): Promise<void> {
    try {
      await directory.secrets.recordLogin({
        accountId: account?.id ?? null,
        identifier,
        loginMethod: account?.loginMethod ?? null,
        isSuccess: failureReason === null,
        failureReason,
        ...client,
      });
    } catch (error) {
      logger.error("Failed to write login log", { kind: directory.kind, error: String(error) });
    }
  }
}

export const authService = new AuthService();
