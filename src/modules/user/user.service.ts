import {
  AppError,
  buildPaginatedData,
  ERROR_CODES,
  pageOffset,
  PageRequest,
  PaginatedData,
  validationError,
} from "../../common";
import { AppUserLoginLogModel, AppUserSessionModel } from "../../infrastructure/database";

import {
  AccountDirectory,
  AccountSecrets,
  LoginLogRepository,
  SessionRepository,
  withUniqueColumns,
} from "../accounts";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { UserChanges, userPasswords, UserRepository, userRepository } from "./user.repository";
import { AppUser, UserSession } from "./types/user.type";

function notFound(message = "User not found."): AppError {
  return new AppError(404, ERROR_CODES.USER_NOT_FOUND, message);
}

const UNIQUE_COLUMNS = {
  email: () => new AppError(409, ERROR_CODES.USER_EMAIL_TAKEN, "This email is already in use."),
  phone: () =>
    new AppError(409, ERROR_CODES.USER_PHONE_TAKEN, "This phone number is already in use."),
};

/** A flag can only be true while its contact detail exists. */
function verifiedFlags(
  user: Pick<AppUser, "email" | "phone" | "isEmailVerified" | "isPhoneVerified">,
) {
  return {
    isEmailVerified: user.email !== null && user.isEmailVerified,
    isPhoneVerified: user.phone !== null && user.isPhoneVerified,
  };
}

/**
 * App users (basic details), their secrets, and their login log. Managed by
 * admins; also the user AccountDirectory, so the auth module can sign users in.
 */
export class UserService implements AccountDirectory<AppUser, UserSession> {
  readonly kind = "user";

  constructor(
    private readonly users: UserRepository = userRepository,
    readonly secrets: AccountSecrets = new AccountSecrets(
      userPasswords,
      new LoginLogRepository(AppUserLoginLogModel, 255),
      new SessionRepository(AppUserSessionModel),
    ),
  ) {}

  // ── Management ────────────────────────────────────────────────────────────

  async listUsers(page: PageRequest, search?: string): Promise<PaginatedData<AppUser>> {
    const { rows, count } = await this.users.findAll(pageOffset(page), page.limit, search);
    return buildPaginatedData(rows, { ...page, total: count });
  }

  /** Any user, active or not. */
  async getUserById(id: string): Promise<AppUser> {
    const user = await this.users.findById(id);
    if (!user) throw notFound();
    return user;
  }

  async createUser(data: CreateUserDto): Promise<AppUser> {
    const contact = { email: data.email ?? null, phone: data.phone ?? null };
    const passwordHash = await this.secrets.hashForNewAccount(data.loginMethod, data.password);

    return withUniqueColumns(
      this.users.create({
        name: data.name,
        ...contact,
        loginMethod: data.loginMethod,
        isActive: data.isActive ?? true,
        ...verifiedFlags({
          ...contact,
          isEmailVerified: data.isEmailVerified ?? false,
          isPhoneVerified: data.isPhoneVerified ?? false,
        }),
        passwordHash,
      }),
      UNIQUE_COLUMNS,
    );
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<AppUser> {
    const existing = await this.getUserById(id);
    const next = { ...existing, ...data } as AppUser;

    if (!next.email && !next.phone) {
      throw validationError("A user needs an email or a phone number.");
    }
    // A new email or phone is unverified unless the flag is sent with it.
    if (next.email !== existing.email && data.isEmailVerified === undefined) {
      next.isEmailVerified = false;
    }
    if (next.phone !== existing.phone && data.isPhoneVerified === undefined) {
      next.isPhoneVerified = false;
    }
    await this.secrets.assertCanSwitchMethod(id, existing.loginMethod, data.loginMethod);

    const changes: UserChanges = { ...data, ...verifiedFlags(next) };
    const updated = await withUniqueColumns(this.users.update(id, changes), UNIQUE_COLUMNS);
    // A deactivated user is signed out everywhere.
    if (data.isActive === false) await this.secrets.endAllSessions(id);
    return updated as AppUser;
  }

  async resetPassword(id: string, password: string): Promise<null> {
    await this.getUserById(id);
    await this.secrets.resetPassword(id, password);
    return null;
  }

  // ── AccountDirectory (used by the auth module) ────────────────────────────

  findByIdentifier(identifier: string): Promise<AppUser | null> {
    return this.users.findBySignInIdentifier(identifier);
  }

  findById(id: string): Promise<AppUser | null> {
    return this.users.findById(id);
  }

  notFoundError(): AppError {
    return notFound("No account with this email or phone number.");
  }

  toSession({ id, name, email, phone, loginMethod }: AppUser): UserSession {
    return { id, name, email, phone, loginMethod };
  }
}

export const userService = new UserService();
