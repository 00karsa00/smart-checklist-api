import { configuration } from "../../config/configuration";
import { ApiModule, Route } from "../../infrastructure/http";

import { generateToken, validateToken } from "./auth.controller";
import { validateGenerateTokenBody, validateValidateTokenBody } from "./auth.validator";

// Mints a token for any active user id, with no password. Local testing only;
// off in production unless AUTH_ALLOW_DEV_TOKENS=true.
const devTokenRoute: Route = {
  method: "post",
  path: "/token",
  guards: [validateGenerateTokenBody],
  status: 201,
  handler: generateToken,
};

export const authModule: ApiModule = {
  path: "/auth",
  routes: [
    ...(configuration.auth.allowDevTokens ? [devTokenRoute] : []),
    {
      method: "post",
      path: "/token/validate",
      guards: [validateValidateTokenBody],
      handler: validateToken,
    },
  ],
};
