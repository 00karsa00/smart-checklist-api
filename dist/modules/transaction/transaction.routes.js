"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../common/middleware/auth.middleware");
const transaction_controller_1 = require("./transaction.controller");
const transaction_validator_1 = require("./transaction.validator");
const router = (0, express_1.Router)();
// All transaction routes require a valid JWT
router.use(auth_middleware_1.authMiddleware);
router.get("/", transaction_validator_1.validateTransactionListQuery, transaction_controller_1.getTransactions);
router.get("/:id", transaction_validator_1.validateTransactionIdParam, transaction_controller_1.getTransaction);
router.post("/", transaction_validator_1.validateCreateTransaction, transaction_controller_1.createTransaction);
router.patch("/:id", transaction_validator_1.validateTransactionIdParam, transaction_validator_1.validateUpdateTransaction, transaction_controller_1.updateTransaction);
router.delete("/:id", transaction_validator_1.validateTransactionIdParam, transaction_controller_1.deleteTransaction);
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map