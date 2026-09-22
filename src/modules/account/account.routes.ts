import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
} from "./account.controller";
import {
  validateAccountIdParam,
  validateAccountListQuery,
  validateCreateAccount,
  validateUpdateAccount,
} from "./account.validator";

const router = Router();

// All account routes require a valid JWT. The authenticated user is attached to
// req.user by the middleware and is the sole source of ownership — the client
// never supplies user_id.
router.use(authMiddleware);

router.get("/", validateAccountListQuery, getAccounts);
router.get("/:id", validateAccountIdParam, getAccount);
router.post("/", validateCreateAccount, createAccount);
router.patch("/:id", validateAccountIdParam, validateUpdateAccount, updateAccount);
router.delete("/:id", validateAccountIdParam, deleteAccount);

export default router;
