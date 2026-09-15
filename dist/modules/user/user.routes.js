"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const user_validator_1 = require("./user.validator");
const router = (0, express_1.Router)();
router.get("/", user_validator_1.validateUserListQuery, user_controller_1.getUsers);
router.get("/:id", user_validator_1.validateUserIdParam, user_controller_1.getUser);
router.post("/", user_validator_1.validateCreateUser, user_controller_1.createUser);
router.patch("/:id", user_validator_1.validateUserIdParam, user_validator_1.validateUpdateUser, user_controller_1.updateUser);
router.delete("/:id", user_validator_1.validateUserIdParam, user_controller_1.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map