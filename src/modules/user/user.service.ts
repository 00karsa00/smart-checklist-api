import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { PaginatedData, buildPaginatedData, pageOffset } from "../../common/pagination";

import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { User } from "./types/user.type";
import { userRepository } from "./user.repository";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

/** User business logic. Takes plain values, returns plain data. */
class UserService {
  async listUsers(payload: { page?: number; limit?: number } = {}): Promise<PaginatedData<User>> {
    const page = payload.page ?? DEFAULT_PAGE;
    const limit = payload.limit ?? DEFAULT_LIMIT;

    const { rows, count } = await userRepository.findAll(pageOffset({ page, limit }), limit);

    return buildPaginatedData(rows, { page, limit, total: count });
  }

  async getUserById(id: string): Promise<User> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, "User not found");
    }

    return user;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new AppError(
        409,
        ERROR_CODES.USER_ALREADY_EXISTS,
        "User with this email already exists",
      );
    }

    return userRepository.create(data);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    await this.getUserById(id);

    if (data.email) {
      const existingUser = await userRepository.findByEmail(data.email);

      if (existingUser && existingUser.id !== id) {
        throw new AppError(
          409,
          ERROR_CODES.USER_ALREADY_EXISTS,
          "User with this email already exists",
        );
      }
    }

    return (await userRepository.update(id, data)) as User;
  }

  async deleteUser(id: string): Promise<null> {
    await this.getUserById(id);
    await userRepository.delete(id);
    return null;
  }
}

export const userService = new UserService();
