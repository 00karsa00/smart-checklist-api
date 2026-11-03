import { User } from "../../infrastructure/database";

import {
  CreateUserDto,
  UpdateUserDto,
} from "./dto/user.dto";

export interface PaginatedUsers {
  rows: User[];
  count: number;
}

class UserRepository {
  async findAll(offset: number, limit: number): Promise<PaginatedUsers> {
    const { rows, count } = await User.findAndCountAll({
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });
    return { rows, count };
  }

  async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({
      where: {
        email: email.toLowerCase(),
      },
    });
  }

  async create(data: CreateUserDto): Promise<User> {
    return User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      isActive: true,
    });
  }

  async update(
    id: string,
    data: UpdateUserDto,
  ): Promise<User | null> {
    const user = await User.findByPk(id);

    if (!user) {
      return null;
    }

    if (data.name !== undefined) {
      user.name = data.name;
    }

    if (data.email !== undefined) {
      user.email = data.email.toLowerCase();
    }

    if (data.isActive !== undefined) {
      user.isActive = data.isActive;
    }

    await user.save();

    return user;
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await User.destroy({
      where: {
        id,
      },
    });

    return deletedCount > 0;
  }
}

export const userRepository = new UserRepository();