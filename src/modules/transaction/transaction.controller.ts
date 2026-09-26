import { Request, Response, NextFunction } from "express";

import { ApiSuccessResponse } from "../../common/responses/api-response";
import "../../common/types/request-context.type";

import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionIdParams,
  TransactionListQuery,
} from "./dto/transaction.dto";
import { Transaction } from "./types/transaction.type";
import { transactionService } from "./transaction.service";
import { PaginatedData } from "../../common/responses/api-response";

// ── Helpers ───────────────────────────────────────────────────────────────────

function withRequestId<T>(
  response: ApiSuccessResponse<T>,
  req: Request,
): ApiSuccessResponse<T> {
  return { ...response, requestId: req.headers["x-request-id"] };
}

// ── Controllers ───────────────────────────────────────────────────────────────

export async function getTransactions(
  req: Request<Record<string, never>, ApiSuccessResponse<PaginatedData<Transaction>>, never, TransactionListQuery & { [key: string]: string | undefined }>,
  res: Response<ApiSuccessResponse<PaginatedData<Transaction>>>,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? "10", 10) || 10));

    const result = await transactionService.getAllTransactions(userId, page, limit, {
      accountId: req.query.accountId as string | undefined,
      transactionTypeId: req.query.transactionTypeId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    });

    res.status(200).json(withRequestId(result, req as unknown as Request));
  } catch (error) {
    next(error);
  }
}

export async function getTransaction(
  req: Request<TransactionIdParams>,
  res: Response<ApiSuccessResponse<Transaction>>,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await transactionService.getTransactionById(
      req.params.id,
      req.user!.userId,
    );
    res.status(200).json(withRequestId(result, req));
  } catch (error) {
    next(error);
  }
}

export async function createTransaction(
  req: Request<Record<string, never>, ApiSuccessResponse<Transaction>, CreateTransactionDto>,
  res: Response<ApiSuccessResponse<Transaction>>,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await transactionService.createTransaction(
      req.body,
      req.user!.userId,
    );
    res.status(201).json(withRequestId(result, req));
  } catch (error) {
    next(error);
  }
}

export async function updateTransaction(
  req: Request<TransactionIdParams, ApiSuccessResponse<Transaction>, UpdateTransactionDto>,
  res: Response<ApiSuccessResponse<Transaction>>,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await transactionService.updateTransaction(
      req.params.id,
      req.user!.userId,
      req.body,
    );
    res.status(200).json(withRequestId(result, req));
  } catch (error) {
    next(error);
  }
}

export async function deleteTransaction(
  req: Request<TransactionIdParams>,
  res: Response<ApiSuccessResponse<null>>,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await transactionService.deleteTransaction(
      req.params.id,
      req.user!.userId,
    );
    res.status(200).json(withRequestId(result, req));
  } catch (error) {
    next(error);
  }
}
