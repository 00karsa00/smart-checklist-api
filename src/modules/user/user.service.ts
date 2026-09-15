
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import {
  ApiSuccessResponse,
  successResponse,
} from "../../common/responses/api-response";

import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { User } from "./types/user.type";
import { userRepository } from "./user.repository";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

class UserService {
  
  async getAllUsers({
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  }: { page?: number; limit?: number } = {}): Promise<ApiSuccessResponse<User[]>> {
    const offset = (page - 1) * limit;
    const { rows, count } = await userRepository.findAll(offset, limit);

    return successResponse(rows, undefined, {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  }

  async getUserById(id: string): Promise<ApiSuccessResponse<User>> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError(
        404,
        ERROR_CODES.USER_NOT_FOUND,
        "User not found",
      );
    }

    return successResponse(user, undefined);
  }

  async createUser(
    data: CreateUserDto,
  ): Promise<ApiSuccessResponse<User>> {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new AppError(
        409,
        ERROR_CODES.USER_ALREADY_EXISTS,
        "User with this email already exists",
      );
    }

    const user = await userRepository.create(data);
    return successResponse(user, undefined);
  }

  async updateUser(
    id: string,
    data: UpdateUserDto,
  ): Promise<ApiSuccessResponse<User>> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError(
        404,
        ERROR_CODES.USER_NOT_FOUND,
        "User not found",
      );
    }

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

    const updated = (await userRepository.update(id, data)) as User;
    return successResponse(updated, undefined);
  }

  async deleteUser(id: string): Promise<ApiSuccessResponse<null>> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError(
        404,
        ERROR_CODES.USER_NOT_FOUND,
        "User not found",
      );
    }

    await userRepository.delete(id);
    return successResponse(null, undefined);
  }
}

export const userService = new UserService();
