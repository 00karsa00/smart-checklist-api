import { PageQuery } from "../../../common";

import { LoginMethod } from "../../accounts";

// The validator normalises `email` (trimmed, lower-case) and `phone` (no
// spaces or separators). A user always keeps an email or a phone.

export type CreateUserDto = {
  name: string;
  email?: string | null;
  phone?: string | null;
  loginMethod: LoginMethod;
  /** Required when loginMethod is "password". */
  password?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
};

/** Self-registration (POST /auth/user/register). */
export type RegisterUserDto = Pick<CreateUserDto, "name" | "email" | "phone"> & {
  password: string;
};

/** Changing the email or phone clears its verified flag unless the flag is sent too. */
export type UpdateUserDto = Partial<Omit<CreateUserDto, "password">>;

export type UserListQuery = {
  /** Part of the name, email or phone. */
  search?: string;
} & PageQuery;
