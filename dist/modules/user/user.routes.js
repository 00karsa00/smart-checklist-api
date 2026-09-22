"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const route_definition_type_1 = require("../../common/types/route-definition.type");
const user_controller_1 = require("./user.controller");
const user_validator_1 = require("./user.validator");
const router = (0, express_1.Router)();
const userRoutes = [
    {
        method: "get",
        path: "/",
        middlewares: [user_validator_1.validateUserListQuery],
        handler: user_controller_1.getUsers,
    },
    {
        method: "get",
        path: "/:id",
        middlewares: [user_validator_1.validateUserIdParam],
        handler: user_controller_1.getUser,
    },
    {
        method: "post",
        path: "/",
        middlewares: [user_validator_1.validateCreateUser],
        handler: user_controller_1.createUser,
    },
    {
        method: "patch",
        path: "/:id",
        middlewares: [user_validator_1.validateUserIdParam, user_validator_1.validateUpdateUser],
        handler: user_controller_1.updateUser,
    },
    {
        method: "delete",
        path: "/:id",
        middlewares: [user_validator_1.validateUserIdParam],
        handler: user_controller_1.deleteUser,
    },
];
(0, route_definition_type_1.registerRoutes)(router, userRoutes);
exports.default = router;
//# sourceMappingURL=user.routes.js.map