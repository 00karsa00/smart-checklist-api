"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../common/middleware/auth.middleware");
const account_controller_1 = require("./account.controller");
const account_validator_1 = require("./account.validator");
const router = (0, express_1.Router)();
// All account routes require a valid JWT. The authenticated user is attached to
// req.user by the middleware and is the sole source of ownership — the client
// never supplies user_id.
router.use(auth_middleware_1.authMiddleware);
router.get("/", account_validator_1.validateAccountListQuery, account_controller_1.getAccounts);
router.get("/:id", account_validator_1.validateAccountIdParam, account_controller_1.getAccount);
router.post("/", account_validator_1.validateCreateAccount, account_controller_1.createAccount);
router.patch("/:id", account_validator_1.validateAccountIdParam, account_validator_1.validateUpdateAccount, account_controller_1.updateAccount);
router.delete("/:id", account_validator_1.validateAccountIdParam, account_controller_1.deleteAccount);
exports.default = router;
//# sourceMappingURL=account.routes.js.map