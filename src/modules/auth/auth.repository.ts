import { User } from "../../infrastructure/database";

class AuthRepository {
  async findById(id: string): Promise<User | null> {
    return User.findOne({
      where: { id, isActive: true },
    });
  }
}

export const authRepository = new AuthRepository();
