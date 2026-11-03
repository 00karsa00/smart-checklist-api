import { HttpContext } from "../../infrastructure/http";

import { GenerateTokenDto, ValidateTokenDto } from "./dto/auth.dto";
import { authService } from "./auth.service";

type NoParams = Record<string, never>;

export function generateToken(ctx: HttpContext<NoParams, NoParams, GenerateTokenDto>) {
  return authService.generateToken(ctx.body);
}

export function validateToken(ctx: HttpContext<NoParams, NoParams, ValidateTokenDto>) {
  return authService.validateToken(ctx.body);
}
