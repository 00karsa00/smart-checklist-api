import { authenticateAs } from "../../common";
import { configuration } from "../../config/configuration";
import { ApiModule, failureLimit, RateCounter, rateLimit } from "../../infrastructure/http";

import {
  adminMe,
  identifyAdmin,
  identifyUser,
  loginAdmin,
  loginUser,
  logoutAdmin,
  logoutUser,
  refreshAdmin,
  refreshUser,
  registerUser,
  userMe,
  validateToken,
} from "./auth.controller";
import {
  validateAdminSignIn,
  validateRefreshTokenBody,
  validateUserSignIn,
  validateValidateTokenBody,
} from "./auth.validator";
import { validateRegisterUser } from "../user/user.validator";

// Sign-in for every kind of account: POST …/identify → login method, then
// POST …/login → access token + refresh token. POST …/refresh swaps a refresh
// token for a new pair; POST …/logout ends that session. Admins sign in with a
// user name, users with email or phone.
const withRefreshToken = [validateRefreshTokenBody];

// Limits on guessing: sign-in attempts per caller and account, all sign-in
// steps per caller, and registrations per caller (configuration.auth.rateLimit).
const limits = configuration.auth.rateLimit;
const window = { windowMinutes: limits.windowMinutes };
const signInCounter = new RateCounter(limits.windowMinutes * 60_000);
const perIp = rateLimit({
  ...window,
  name: "sign-in-ip",
  max: limits.signInPerIp,
  counter: signInCounter,
  key: (ctx) => ctx.ip,
});
/**
 * Failed sign-ins per caller and account (wrong password, no such account);
 * successful ones never count. After the sign-in validator, so the account
 * name is normalised.
 */
const perAccount = failureLimit({
  ...window,
  name: "sign-in-account",
  max: limits.signInPerAccount,
  key: (ctx) => {
    const body = ctx.body as { identifier?: string; userName?: string };
    const account = body.identifier ?? body.userName;
    return account ? `${ctx.ip}:${account}` : null;
  },
});
const registerLimit = rateLimit({
  ...window,
  name: "register",
  max: limits.registerPerIp,
  key: (ctx) => ctx.ip,
});
const adminSignIn = [perIp, validateAdminSignIn];
const userSignIn = [perIp, validateUserSignIn];
export const authModule: ApiModule = {
  path: "/auth",
  routes: [
    {
      method: "post",
      path: "/admin/identify",
      guards: adminSignIn,
      handler: identifyAdmin,
    },
    {
      method: "post",
      path: "/admin/login",
      guards: [...adminSignIn, perAccount.guard],
      handler: perAccount.counting(loginAdmin),
    },
    { method: "post", path: "/admin/refresh", guards: withRefreshToken, handler: refreshAdmin },
    { method: "post", path: "/admin/logout", guards: withRefreshToken, handler: logoutAdmin },
    { method: "get", path: "/admin/me", guards: [authenticateAs("admin")], handler: adminMe },

    {
      method: "post",
      path: "/user/register",
      guards: [registerLimit, validateRegisterUser],
      status: 201,
      handler: registerUser,
    },
    { method: "post", path: "/user/identify", guards: userSignIn, handler: identifyUser },
    {
      method: "post",
      path: "/user/login",
      guards: [...userSignIn, perAccount.guard],
      handler: perAccount.counting(loginUser),
    },
    { method: "post", path: "/user/refresh", guards: withRefreshToken, handler: refreshUser },
    { method: "post", path: "/user/logout", guards: withRefreshToken, handler: logoutUser },
    { method: "get", path: "/user/me", guards: [authenticateAs("user")], handler: userMe },

    {
      method: "post",
      path: "/token/validate",
      guards: [validateValidateTokenBody],
      handler: validateToken,
    },
  ],
};
