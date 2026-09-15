"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRepository = void 0;
const user_model_1 = require("../../infrastructure/database/models/user.model");
class AuthRepository {
    async findById(id) {
        return user_model_1.User.findOne({
            where: { id, isActive: true },
        });
    }
}
exports.authRepository = new AuthRepository();
//# sourceMappingURL=auth.repository.js.map