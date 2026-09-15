import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "./transaction.controller";
import {
  validateTransactionIdParam,
  validateTransactionListQuery,
  validateCreateTransaction,
  validateUpdateTransaction,
} from "./transaction.validator";

const router = Router();

// All transaction routes require a valid JWT
router.use(authMiddleware);

router.get("/", validateTransactionListQuery, getTransactions);
router.get("/:id", validateTransactionIdParam, getTransaction);
router.post("/", validateCreateTransaction, createTransaction);
router.patch("/:id", validateTransactionIdParam, validateUpdateTransaction, updateTransaction);
router.delete("/:id", validateTransactionIdParam, deleteTransaction);

export default router;
