import { Request, Response, NextFunction } from "express";

import { ApiSuccessResponse } from "../../common/responses/api-response";
import "../../common/types/request-context.type";

import {
  CreateAccountDto,
  UpdateAccountDto,
  AccountIdParams,
  AccountListQuery,
} from "./dto/account.dto";
import { Account } from "./types/account.type";
import { accountService } from "./account.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function withRequestId<T>(
  response: ApiSuccessResponse<T>,
  req: Request,
): ApiSuccessResponse<T> {
  return { ...response, requestId: req.headers["x-request-id"] };
}

// ── Controllers ───────────────────────────────────────────────────────────────

export async function getAccounts(
  req: Request<Record<string, never>, ApiSuccessResponse<Account[]>, never, AccountListQuery & Record<string, string | undefined>>,
  res: Response<ApiSuccessResponse<Account[]>>,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? "10", 10) || 10));

    const result = await accountService.getAllAccounts(userId, page, limit, {
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
    });

    res.status(200).json(withRequestId(result, req as unknown as Request));
  } catch (error) {
    next(error);
  }
}

export async function getAccount(
  req: Request<AccountIdParams>,
  res: Response<ApiSuccessResponse<Account>>,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await accountService.getAccountById(req.params.id, req.user!.userId);
    res.status(200).json(withRequestId(result, req));
  } catch (error) {
    next(error);
  }
}

export async function createAccount(
  req: Request<Record<string, never>, ApiSuccessResponse<Account>, CreateAccountDto>,
  res: Response<ApiSuccessResponse<Account>>,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await accountService.createAccount(req.body, req.user!.userId);
    res.status(201).json(withRequestId(result, req));
  } catch (error) {
    next(error);
  }
}

export async function updateAccount(
  req: Request<AccountIdParams, ApiSuccessResponse<Account>, UpdateAccountDto>,
  res: Response<ApiSuccessResponse<Account>>,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await accountService.updateAccount(
      req.params.id,
      req.user!.userId,
      req.body,
    );
    res.status(200).json(withRequestId(result, req));
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(
  req: Request<AccountIdParams>,
  res: Response<ApiSuccessResponse<null>>,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await accountService.deleteAccount(req.params.id, req.user!.userId);
    res.status(200).json(withRequestId(result, req));
  } catch (error) {
    next(error);
  }
}
