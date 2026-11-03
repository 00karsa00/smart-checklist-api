import { authenticate } from "../../common/guards/auth.guard";
import { ApiModule } from "../../infrastructure/http";

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactions,
  updateTransaction,
} from "./transaction.controller";
import {
  validateCreateTransaction,
  validateTransactionIdParam,
  validateTransactionListQuery,
  validateUpdateTransaction,
} from "./transaction.validator";

export const transactionModule: ApiModule = {
  path: "/transactions",
  guards: [authenticate],
  routes: [
    { method: "get", path: "/", guards: [validateTransactionListQuery], handler: getTransactions },
    { method: "get", path: "/:id", guards: [validateTransactionIdParam], handler: getTransaction },
    {
      method: "post",
      path: "/",
      guards: [validateCreateTransaction],
      status: 201,
      handler: createTransaction,
    },
    {
      method: "patch",
      path: "/:id",
      guards: [validateTransactionIdParam, validateUpdateTransaction],
      handler: updateTransaction,
    },
    {
      method: "delete",
      path: "/:id",
      guards: [validateTransactionIdParam],
      handler: deleteTransaction,
    },
  ],
};
