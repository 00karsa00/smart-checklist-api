// Shared setup for the API tests in this folder (npm run test:e2e). Each test
// file starts the real app on a free port against the database in .env, and
// signs up its own accounts, all named with E2E_PREFIX so cleanup() (also
// `npm run test:cleanup`) can remove them.

import { randomUUID } from "node:crypto";

import { Op } from "sequelize";

import { createApp } from "../app";
import { HttpServer } from "../infrastructure/http";
import {
  AdminAuditLogModel,
  AdminLoginLogModel,
  AdminUserModel,
  AppUserLoginLogModel,
  AppUserModel,
  connectDatabase,
  disconnectDatabase,
} from "../infrastructure/database";
import { adminService } from "../modules/admin/admin.service";
import { AdminRole } from "../modules/admin/admin-roles";

/** Every account the tests create starts with this. */
export const E2E_PREFIX = "e2e-";
export const PASSWORD = "Password1!";
/** Admins the web app's browser tests sign in as (npm run test:admins). */
export const E2E_ADMINS = { super_admin: "e2e-super-admin", viewer: "e2e-viewer" } as const;

export type ApiResult<T = any> = {
  status: number;
  data: T;
  code?: string;
  message?: string;
};

export type Api = {
  /** A JSON request; `token` signs it in. */
  call<T = any>(
    method: string,
    path: string,
    body?: unknown,
    token?: string,
  ): Promise<ApiResult<T>>;
  /** A JSON request that must succeed; returns its data (for setting up a test). */
  send<T = any>(method: string, path: string, body: unknown, token: string): Promise<T>;
  /** Any request, returning the raw response (files, CSV bodies). */
  raw(
    method: string,
    path: string,
    options?: { body?: BodyInit; type?: string; token?: string },
  ): Promise<Response>;
  /** Sign in again (a new session): its access and refresh tokens. */
  login(
    kind: "user" | "admin",
    who: string,
    password?: string,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  /** A new app user, signed in. */
  user(name?: string): Promise<{ token: string; email: string; id: string }>;
  /** A new admin with a role, signed in. */
  admin(role: AdminRole): Promise<{ token: string; userName: string; id: string }>;
  close(): Promise<void>;
};

const unique = () => randomUUID().slice(0, 8);

/** Start the API for one test file (call in beforeAll, then close() in afterAll). */
export async function startApi(): Promise<Api> {
  await connectDatabase();
  const server: HttpServer = await createApp().listen(0);
  const base = `http://127.0.0.1:${server.port}/api`;

  const raw: Api["raw"] = (method, path, { body, type = "application/json", token } = {}) =>
    fetch(base + path, {
      method,
      headers: { "content-type": type, ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body,
    });

  const call: Api["call"] = async (method, path, body, token) => {
    const response = await raw(method, path, {
      body: body === undefined ? undefined : JSON.stringify(body),
      token,
    });
    const json = (await response.json()) as {
      data?: unknown;
      error?: { code?: string; message?: string };
    };
    return {
      status: response.status,
      data: json.data as never,
      code: json.error?.code,
      message: json.error?.message,
    };
  };

  return {
    call,
    raw,
    async send(method, path, body, token) {
      const result = await call(method, path, body, token);
      if (result.status >= 400)
        throw new Error(`${method} ${path}: ${result.status} ${result.message}`);
      return result.data;
    },
    async login(kind, who, password = PASSWORD) {
      const body = kind === "admin" ? { userName: who, password } : { identifier: who, password };
      const result = await call("POST", `/auth/${kind}/login`, body);
      if (result.status !== 200)
        throw new Error(`login failed: ${result.status} ${result.message}`);
      return { accessToken: result.data.accessToken, refreshToken: result.data.refreshToken };
    },
    async user(name = "Test User") {
      const email = `${E2E_PREFIX}${unique()}@example.com`;
      const result = await call("POST", "/auth/user/register", { name, email, password: PASSWORD });
      if (result.status !== 201) throw new Error(`register failed: ${result.message}`);
      return { token: result.data.accessToken, email, id: result.data.user.id };
    },
    async admin(role) {
      const userName = `${E2E_PREFIX}${unique()}`;
      const created = await adminService.createAdmin({
        userName,
        loginMethod: "password",
        password: PASSWORD,
        role,
      });
      const result = await call("POST", "/auth/admin/login", { userName, password: PASSWORD });
      return { token: result.data.accessToken, userName, id: created.id };
    },
    async close() {
      await server.close();
      await cleanup();
      await disconnectDatabase();
    },
  };
}

/** Remove every test account and what hangs off it (their records cascade). */
export async function cleanup(): Promise<{ users: number; admins: number }> {
  const like = { [Op.like]: `${E2E_PREFIX}%` };
  const users = await AppUserModel.findAll({ where: { email: like } });
  await AdminAuditLogModel.destroy({
    where: { [Op.or]: [{ adminUserName: like }, { targetLabel: like }] },
  });
  const admins = await AdminUserModel.destroy({ where: { userName: like } });
  await AdminLoginLogModel.destroy({ where: { identifier: like } });
  await AppUserModel.destroy({ where: { email: like } });
  await AppUserLoginLogModel.destroy({ where: { identifier: like } });
  return { users: users.length, admins };
}

/** Today in the default time zone (new users have it), as YYYY-MM-DD. */
export { todayIn } from "../common";
