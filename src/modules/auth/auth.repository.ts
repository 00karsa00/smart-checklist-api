import { User } from "../../infrastructure/database/models/user.model";

class AuthRepository {
  async findById(id: string): Promise<User | null> {
    return User.findOne({
      where: { id, isActive: true },
    });
  }
}

export const authRepository = new AuthRepository();
