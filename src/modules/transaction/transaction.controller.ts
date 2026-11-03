import { currentUserId } from "../../common/guards/auth.guard";
import { parsePageQuery } from "../../common/pagination";
import { HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import {
  CreateTransactionDto,
  TransactionListQuery,
  UpdateTransactionDto,
} from "./dto/transaction.dto";
import { transactionService } from "./transaction.service";

// Controllers translate the request into service arguments. No business rules.

export function getTransactions(ctx: HttpContext<NoParams, TransactionListQuery>) {
  const { page, limit } = parsePageQuery(ctx.query);
  const { accountId, transactionTypeId, startDate, endDate } = ctx.query;
  return transactionService.getAllTransactions(currentUserId(ctx), page, limit, {
    accountId,
    transactionTypeId,
    startDate,
    endDate,
  });
}

export function getTransaction(ctx: HttpContext<IdParams>) {
  return transactionService.getTransactionById(ctx.params.id, currentUserId(ctx));
}

export function createTransaction(ctx: HttpContext<NoParams, NoParams, CreateTransactionDto>) {
  return transactionService.createTransaction(ctx.body, currentUserId(ctx));
}

export function updateTransaction(ctx: HttpContext<NoParams, UpdateTransactionDto>) {
  return transactionService.updateTransaction(ctx.params.id, currentUserId(ctx), ctx.body);
}

export function deleteTransaction(ctx: HttpContext<IdParams>) {
  return transactionService.deleteTransaction(ctx.params.id, currentUserId(ctx));
}
