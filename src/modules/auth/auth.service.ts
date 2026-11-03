import { configuration } from "../../config/configuration";
import { requireValidToken } from "../../common";
import { signToken } from "../../infrastructure/token";

import { GenerateTokenDto, ValidateTokenDto } from "./dto/auth.dto";
import { GenerateTokenResponse, ValidateTokenResponse } from "./types/auth.type";

// Development tokens only. When the project adds users, check here that the
// user exists and is active before signing (and replace this with real login).
class AuthService {
  async generateToken(data: GenerateTokenDto): Promise<GenerateTokenResponse> {
    return {
      accessToken: signToken(data.userId),
      tokenType: "Bearer",
      expiresIn: configuration.jwt.expiresIn,
      userId: data.userId,
    };
  }

  async validateToken(data: ValidateTokenDto): Promise<ValidateTokenResponse> {
    const { sub: userId, iat, exp } = requireValidToken(data.token);

    return {
      valid: true,
      userId,
      issuedAt: new Date((iat as number) * 1000),
      expiresAt: new Date((exp as number) * 1000),
    };
  }
}

export const authService = new AuthService();
