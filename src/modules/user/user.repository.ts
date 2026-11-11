import {
  AppUserModel,
  AppUserPasswordModel,
  containsText,
  matchAny,
  Where,
} from "../../infrastructure/database";

import { PasswordRepository } from "../accounts";
import { AppUser } from "./types/user.type";

export type PaginatedUsers = {
  rows: AppUser[];
  count: number;
};

export type NewUser = Omit<AppUser, "id" | "createdAt" | "updatedAt"> & {
  /** Stored in app_user_password when given. */
  passwordHash?: string;
};

export type UserChanges = Partial<Omit<AppUser, "id" | "createdAt" | "updatedAt">>;

export const userPasswords = new PasswordRepository(AppUserPasswordModel);

function toUser(row: AppUserModel): AppUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    loginMethod: row.loginMethod,
    isActive: row.isActive,
    isEmailVerified: row.isEmailVerified,
    isPhoneVerified: row.isPhoneVerified,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Data access for app_user. Secrets go through `userPasswords`. */
export class UserRepository {
  constructor(private readonly passwords: PasswordRepository = userPasswords) {}

  async findAll(offset: number, limit: number, search?: string): Promise<PaginatedUsers> {
    const where: Where = {};
    if (search) {
      const text = containsText(search);
      matchAny(where, [{ name: text }, { email: text }, { phone: text }]);
    }

    const { rows, count } = await AppUserModel.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });
    return { rows: rows.map(toUser), count };
  }

  /** By normalised email (contains "@") or phone. */
  async findBySignInIdentifier(identifier: string): Promise<AppUser | null> {
    const where = identifier.includes("@") ? { email: identifier } : { phone: identifier };
    const row = await AppUserModel.findOne({ where });
    return row ? toUser(row) : null;
  }

  async findById(id: string): Promise<AppUser | null> {
    const row = await AppUserModel.findByPk(id);
    return row ? toUser(row) : null;
  }

  create({ passwordHash, ...data }: NewUser): Promise<AppUser> {
    return this.passwords.createWithHash(
      async (transaction) => toUser(await AppUserModel.create(data, { transaction })),
      passwordHash,
    );
  }

  async update(id: string, changes: UserChanges): Promise<AppUser | null> {
    const row = await AppUserModel.findByPk(id);
    if (!row) return null;
    await row.update(changes);
    return toUser(row);
  }
}

export const userRepository = new UserRepository();
