import {
  AdminUserModel,
  AdminUserPasswordModel,
  containsText,
  Where,
} from "../../infrastructure/database";

import { PasswordRepository } from "../accounts";
import { AdminUser } from "./types/admin.type";

export type PaginatedAdminUsers = {
  rows: AdminUser[];
  count: number;
};

export type NewAdminUser = {
  userName: string;
  loginMethod: string;
  role: string;
  isActive: boolean;
  /** Stored in admin_user_password when given. */
  passwordHash?: string;
};

export type AdminUserChanges = Partial<
  Pick<AdminUser, "userName" | "loginMethod" | "role" | "isActive">
>;

export const adminPasswords = new PasswordRepository(AdminUserPasswordModel);

function toAdminUser(row: AdminUserModel): AdminUser {
  return {
    id: row.id,
    userName: row.userName,
    loginMethod: row.loginMethod,
    role: row.role,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Data access for admin_user. Secrets go through `adminPasswords`. */
export class AdminRepository {
  constructor(private readonly passwords: PasswordRepository = adminPasswords) {}

  async findAll(offset: number, limit: number, search?: string): Promise<PaginatedAdminUsers> {
    const where: Where = {};
    if (search) where.userName = containsText(search);

    const { rows, count } = await AdminUserModel.findAndCountAll({
      where,
      order: [["userName", "ASC"]],
      offset,
      limit,
    });
    return { rows: rows.map(toAdminUser), count };
  }

  /** `userName` must already be normalised (trimmed, lower-case). */
  async findByUserName(userName: string): Promise<AdminUser | null> {
    const row = await AdminUserModel.findOne({ where: { userName } });
    return row ? toAdminUser(row) : null;
  }

  async findById(id: string): Promise<AdminUser | null> {
    const row = await AdminUserModel.findByPk(id);
    return row ? toAdminUser(row) : null;
  }

  create({ passwordHash, ...data }: NewAdminUser): Promise<AdminUser> {
    return this.passwords.createWithHash(
      async (transaction) => toAdminUser(await AdminUserModel.create(data, { transaction })),
      passwordHash,
    );
  }

  async update(id: string, changes: AdminUserChanges): Promise<AdminUser | null> {
    const row = await AdminUserModel.findByPk(id);
    if (!row) return null;
    await row.update(changes);
    return toAdminUser(row);
  }
}

export const adminRepository = new AdminRepository();
