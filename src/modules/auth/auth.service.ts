import { configuration } from "../../config/configuration";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { requireValidToken } from "../../common/guards/auth.guard";
import { signToken } from "../../infrastructure/token";

import { GenerateTokenDto, ValidateTokenDto } from "./dto/auth.dto";
import { GenerateTokenResponse, ValidateTokenResponse } from "./types/auth.type";
import { authRepository } from "./auth.repository";

class AuthService {
  async generateToken(data: GenerateTokenDto): Promise<GenerateTokenResponse> {
    const user = await authRepository.findById(data.userId);

    if (!user) {
      throw new AppError(
        404,
        ERROR_CODES.USER_NOT_FOUND,
        `User with id '${data.userId}' not found or inactive`,
      );
    }

    return {
      accessToken: signToken(user.id),
      tokenType: "Bearer",
      expiresIn: configuration.jwt.expiresIn,
      userId: user.id,
    };
  }

  async validateToken(data: ValidateTokenDto): Promise<ValidateTokenResponse> {
    const { sub: userId, iat, exp } = requireValidToken(data.token);
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError(
        401,
        ERROR_CODES.UNAUTHORIZED,
        "Token is valid but the associated user no longer exists or is inactive",
      );
    }

    return {
      valid: true,
      userId,
      issuedAt: new Date((iat as number) * 1000),
      expiresAt: new Date((exp as number) * 1000),
    };
  }
}

export const authService = new AuthService();
