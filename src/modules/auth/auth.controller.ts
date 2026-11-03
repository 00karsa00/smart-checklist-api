import { HttpContext, NoParams } from "../../infrastructure/http";

import { GenerateTokenDto, ValidateTokenDto } from "./dto/auth.dto";
import { authService } from "./auth.service";

export function generateToken(ctx: HttpContext<NoParams, NoParams, GenerateTokenDto>) {
  return authService.generateToken(ctx.body);
}

export function validateToken(ctx: HttpContext<NoParams, NoParams, ValidateTokenDto>) {
  return authService.validateToken(ctx.body);
}
