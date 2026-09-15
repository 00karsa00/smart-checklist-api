import jwt from "jsonwebtoken";

import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import {
  ApiSuccessResponse,
  successResponse,
} from "../../common/responses/api-response";
import { configuration } from "../../config/configuration";

import { GenerateTokenDto, ValidateTokenDto } from "./dto/auth.dto";
import {
  GenerateTokenResponse,
  TokenPayload,
  ValidateTokenResponse,
} from "./types/auth.type";
import { authRepository } from "./auth.repository";

class AuthService {
  async generateToken(
    data: GenerateTokenDto,
  ): Promise<ApiSuccessResponse<GenerateTokenResponse>> {
    const user = await authRepository.findById(data.userId);

    if (!user) {
      throw new AppError(
        404,
        ERROR_CODES.USER_NOT_FOUND,
        `User with id '${data.userId}' not found or inactive`,
      );
    }

    const payload: TokenPayload = { sub: user.id };

    const accessToken = jwt.sign(payload, configuration.jwt.secret, {
      expiresIn: configuration.jwt.expiresIn as jwt.SignOptions["expiresIn"],
    });

    return successResponse(
      {
        accessToken,
        tokenType: "Bearer",
        expiresIn: configuration.jwt.expiresIn,
        userId: user.id,
      },
      undefined,
    );
  }

  async validateToken(
    data: ValidateTokenDto,
  ): Promise<ApiSuccessResponse<ValidateTokenResponse>> {
    let decoded: jwt.JwtPayload;

    try {
      decoded = jwt.verify(
        data.token,
        configuration.jwt.secret,
      ) as jwt.JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError(
          401,
          ERROR_CODES.TOKEN_EXPIRED,
          "Token has expired",
        );
      }
      throw new AppError(
        401,
        ERROR_CODES.UNAUTHORIZED,
        "Invalid token",
      );
    }

    const userId = decoded.sub as string;
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError(
        401,
        ERROR_CODES.UNAUTHORIZED,
        "Token is valid but the associated user no longer exists or is inactive",
      );
    }

    return successResponse(
      {
        valid: true,
        userId,
        issuedAt: new Date((decoded.iat as number) * 1000),
        expiresAt: new Date((decoded.exp as number) * 1000),
      },
      undefined,
    );
  }
}

export const authService = new AuthService();
