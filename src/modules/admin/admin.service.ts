import {
  AppError,
  buildPaginatedData,
  ERROR_CODES,
  pageOffset,
  PageRequest,
  PaginatedData,
} from "../../common";
import { AdminLoginLogModel, AdminSessionModel } from "../../infrastructure/database";

import {
  AccountDirectory,
  AccountSecrets,
  LoginLogRepository,
  SessionRepository,
  withUniqueColumns,
} from "../accounts";
import { adminPasswords, AdminRepository, adminRepository } from "./admin.repository";
import { DEFAULT_ADMIN_ROLE, permissionsOf } from "./admin-roles";
import { CreateAdminUserDto, UpdateAdminUserDto } from "./dto/admin.dto";
import { AdminSession, AdminUser } from "./types/admin.type";

function notFound(message = "Admin user not found."): AppError {
  return new AppError(404, ERROR_CODES.ADMIN_USER_NOT_FOUND, message);
}

const UNIQUE_COLUMNS = {
  user_name: () =>
    new AppError(409, ERROR_CODES.ADMIN_USER_NAME_TAKEN, "This user name is already taken."),
};

/**
 * Admin users, their secrets, and their login log. Also the admin
 * AccountDirectory, so the auth module can sign admins in.
 */
export class AdminService implements AccountDirectory<AdminUser, AdminSession> {
  readonly kind = "admin";

  constructor(
    private readonly admins: AdminRepository = adminRepository,
    readonly secrets: AccountSecrets = new AccountSecrets(
      adminPasswords,
      new LoginLogRepository(AdminLoginLogModel, 100),
      new SessionRepository(AdminSessionModel),
    ),
  ) {}

  // ── Management ────────────────────────────────────────────────────────────

  async listAdmins(page: PageRequest, search?: string): Promise<PaginatedData<AdminUser>> {
    const { rows, count } = await this.admins.findAll(pageOffset(page), page.limit, search);
    return buildPaginatedData(rows, { ...page, total: count });
  }

  /** Any admin, active or not. */
  async getAdminById(id: string): Promise<AdminUser> {
    const admin = await this.admins.findById(id);
    if (!admin) throw notFound();
    return admin;
  }

  async createAdmin(data: CreateAdminUserDto): Promise<AdminUser> {
    const passwordHash = await this.secrets.hashForNewAccount(data.loginMethod, data.password);
    return withUniqueColumns(
      this.admins.create({
        userName: data.userName,
        loginMethod: data.loginMethod,
        role: data.role ?? DEFAULT_ADMIN_ROLE,
        isActive: data.isActive ?? true,
        passwordHash,
      }),
      UNIQUE_COLUMNS,
    );
  }

  async updateAdmin(
    id: string,
    data: UpdateAdminUserDto,
    currentAdminId: string,
  ): Promise<AdminUser> {
    const existing = await this.getAdminById(id);

    if (id === currentAdminId && data.isActive === false) {
      throw new AppError(
        400,
        ERROR_CODES.ADMIN_CANNOT_DEACTIVATE_SELF,
        "You cannot deactivate your own account.",
      );
    }
    // Nobody can lock themselves out (or promote themselves).
    if (id === currentAdminId && data.role !== undefined && data.role !== existing.role) {
      throw new AppError(
        400,
        ERROR_CODES.ADMIN_CANNOT_CHANGE_OWN_ROLE,
        "You cannot change your own role.",
      );
    }
    await this.secrets.assertCanSwitchMethod(id, existing.loginMethod, data.loginMethod);

    const updated = await withUniqueColumns(this.admins.update(id, data), UNIQUE_COLUMNS);
    // A deactivated admin is signed out everywhere.
    if (data.isActive === false) await this.secrets.endAllSessions(id);
    return updated as AdminUser;
  }

  async resetPassword(id: string, password: string): Promise<null> {
    await this.getAdminById(id);
    await this.secrets.resetPassword(id, password);
    return null;
  }

  // ── AccountDirectory (used by the auth module) ────────────────────────────

  findByIdentifier(userName: string): Promise<AdminUser | null> {
    return this.admins.findByUserName(userName);
  }

  findById(id: string): Promise<AdminUser | null> {
    return this.admins.findById(id);
  }

  notFoundError(): AppError {
    return notFound("No admin account with this user name.");
  }

  toSession({ id, userName, loginMethod, role }: AdminUser): AdminSession {
    return { id, userName, loginMethod, role, permissions: permissionsOf(role) };
  }
}

export const adminService = new AdminService();
